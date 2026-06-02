import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { encodeFunctionData, getAddress, keccak256, toHex } from "viem";

describe("CourseCertificate", async function () {
  const { viem } = await network.create();
  const walletClients = await viem.getWalletClients();
  const [admin, student, student2, outsider] = walletClients;

  const COURSE_ID = 1n;
  const COURSE_ID_2 = 2n;
  const URI = "https://academy-images.example.com/cert/metadata.json";
  const META_HASH = keccak256(toHex("metadata-blob"));

  // Deploys a fresh implementation + UUPS proxy (initialized atomically in the
  // proxy constructor, exactly as the Ignition module does) and returns a
  // contract instance bound to the proxy address.
  async function deploy() {
    const impl = await viem.deployContract("CourseCertificate");
    const initData = encodeFunctionData({
      abi: impl.abi,
      functionName: "initialize",
      args: [admin.account.address],
    });
    const proxy = await viem.deployContract("UUPSProxy", [impl.address, initData]);
    const cert = await viem.getContractAt("CourseCertificate", proxy.address);
    return { impl, cert };
  }

  // Same proxy, but writes are sent from a non-admin account.
  async function asOutsider(address: `0x${string}`) {
    return viem.getContractAt("CourseCertificate", address, {
      client: { wallet: outsider },
    });
  }

  describe("initialization", function () {
    it("grants DEFAULT_ADMIN_ROLE and ADMIN_ROLE to the initial admin", async function () {
      const { cert } = await deploy();
      const DEFAULT_ADMIN_ROLE = await cert.read.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await cert.read.ADMIN_ROLE();

      assert.equal(await cert.read.hasRole([DEFAULT_ADMIN_ROLE, admin.account.address]), true);
      assert.equal(await cert.read.hasRole([ADMIN_ROLE, admin.account.address]), true);
    });

    it("sets the ERC-721 name and symbol", async function () {
      const { cert } = await deploy();
      assert.equal(await cert.read.name(), "RedDuck Academy Certificate");
      assert.equal(await cert.read.symbol(), "Redduck");
    });

    it("cannot be initialized twice (proxy)", async function () {
      const { cert } = await deploy();
      await viem.assertions.revertWithCustomError(
        cert.write.initialize([outsider.account.address]),
        cert,
        "InvalidInitialization",
      );
    });

    it("cannot initialize the implementation directly", async function () {
      const { impl } = await deploy();
      await viem.assertions.revertWithCustomError(
        impl.write.initialize([admin.account.address]),
        impl,
        "InvalidInitialization",
      );
    });
  });

  describe("mint", function () {
    it("mints to the recipient, stores data, and sets the token URI", async function () {
      const { cert } = await deploy();
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);

      assert.equal(getAddress(await cert.read.ownerOf([1n])), getAddress(student.account.address));
      assert.equal(await cert.read.balanceOf([student.account.address]), 1n);
      assert.equal(await cert.read.tokenURI([1n]), URI);

      const [courseId, , metadataHash] = await cert.read.certificates([1n]);
      assert.equal(courseId, COURSE_ID);
      assert.equal(metadataHash, META_HASH);

      assert.deepEqual(await cert.read.getStudentCertificates([student.account.address, COURSE_ID]), [1n]);
    });

    it("emits CertificateMinted with the expected args", async function () {
      const { cert } = await deploy();
      await viem.assertions.emitWithArgs(
        cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]),
        cert,
        "CertificateMinted",
        [1n, getAddress(student.account.address), COURSE_ID, META_HASH],
      );
    });

    it("increments token ids sequentially from 1", async function () {
      const { cert } = await deploy();
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);
      await cert.write.mint([student2.account.address, COURSE_ID, META_HASH, URI]);
      assert.equal(getAddress(await cert.read.ownerOf([1n])), getAddress(student.account.address));
      assert.equal(getAddress(await cert.read.ownerOf([2n])), getAddress(student2.account.address));
    });

    it("reverts when a non-admin mints", async function () {
      const { cert } = await deploy();
      const certAsOutsider = await asOutsider(cert.address);
      await viem.assertions.revertWithCustomError(
        certAsOutsider.write.mint([outsider.account.address, COURSE_ID, META_HASH, URI]),
        cert,
        "AccessControlUnauthorizedAccount",
      );
    });
  });

  describe("mintBatch", function () {
    it("mints a certificate for every entry", async function () {
      const { cert } = await deploy();
      await cert.write.mintBatch([
        [student.account.address, student2.account.address],
        [COURSE_ID, COURSE_ID_2],
        [META_HASH, META_HASH],
        [URI, URI],
      ]);
      assert.equal(getAddress(await cert.read.ownerOf([1n])), getAddress(student.account.address));
      assert.equal(getAddress(await cert.read.ownerOf([2n])), getAddress(student2.account.address));
      assert.equal(await cert.read.balanceOf([student.account.address]), 1n);
    });

    it("reverts on a length mismatch", async function () {
      const { cert } = await deploy();
      await viem.assertions.revertWith(
        cert.write.mintBatch([
          [student.account.address, student2.account.address],
          [COURSE_ID], // shorter
          [META_HASH, META_HASH],
          [URI, URI],
        ]),
        "CourseCertificate: invalid batch",
      );
    });

    it("reverts on an empty batch", async function () {
      const { cert } = await deploy();
      await viem.assertions.revertWith(
        cert.write.mintBatch([[], [], [], []]),
        "CourseCertificate: invalid batch",
      );
    });

    it("reverts when a non-admin batch mints", async function () {
      const { cert } = await deploy();
      const certAsOutsider = await asOutsider(cert.address);
      await viem.assertions.revertWithCustomError(
        certAsOutsider.write.mintBatch([
          [outsider.account.address],
          [COURSE_ID],
          [META_HASH],
          [URI],
        ]),
        cert,
        "AccessControlUnauthorizedAccount",
      );
    });
  });

  describe("soulbound", function () {
    it("blocks transferFrom", async function () {
      const { cert } = await deploy();
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);
      const certAsStudent = await viem.getContractAt("CourseCertificate", cert.address, {
        client: { wallet: student },
      });
      await viem.assertions.revertWith(
        certAsStudent.write.transferFrom([student.account.address, student2.account.address, 1n]),
        "Soulbound: non-transferable",
      );
    });

    it("blocks safeTransferFrom", async function () {
      const { cert } = await deploy();
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);
      const certAsStudent = await viem.getContractAt("CourseCertificate", cert.address, {
        client: { wallet: student },
      });
      await viem.assertions.revertWith(
        certAsStudent.write.safeTransferFrom([student.account.address, student2.account.address, 1n]),
        "Soulbound: non-transferable",
      );
    });
  });

  describe("verifyCertificate", function () {
    it("returns (false, 0, 0) when the student has no certificate", async function () {
      const { cert } = await deploy();
      const [valid, tokenId, metadataHash] = await cert.read.verifyCertificate([
        student.account.address,
        COURSE_ID,
      ]);
      assert.equal(valid, false);
      assert.equal(tokenId, 0n);
      assert.equal(metadataHash, "0x" + "00".repeat(32));
    });

    it("returns the most recently issued certificate for the course", async function () {
      const { cert } = await deploy();
      const firstHash = keccak256(toHex("first"));
      const secondHash = keccak256(toHex("second"));
      await cert.write.mint([student.account.address, COURSE_ID, firstHash, URI]);
      await cert.write.mint([student.account.address, COURSE_ID, secondHash, URI]);

      const [valid, tokenId, metadataHash] = await cert.read.verifyCertificate([
        student.account.address,
        COURSE_ID,
      ]);
      assert.equal(valid, true);
      assert.equal(tokenId, 2n);
      assert.equal(metadataHash, secondHash);
    });
  });

  describe("revokeCertificate", function () {
    it("burns the token and clears bookkeeping", async function () {
      const { cert } = await deploy();
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);

      await cert.write.revokeCertificate([1n]);

      assert.equal(await cert.read.balanceOf([student.account.address]), 0n);
      assert.deepEqual(await cert.read.getStudentCertificates([student.account.address, COURSE_ID]), []);

      const [courseId, , metadataHash] = await cert.read.certificates([1n]);
      assert.equal(courseId, 0n);
      assert.equal(metadataHash, "0x" + "00".repeat(32));

      const [valid] = await cert.read.verifyCertificate([student.account.address, COURSE_ID]);
      assert.equal(valid, false);

      await viem.assertions.revertWithCustomError(
        cert.read.ownerOf([1n]),
        cert,
        "ERC721NonexistentToken",
      );
    });

    it("emits CertificateRevoked", async function () {
      const { cert } = await deploy();
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);
      await viem.assertions.emitWithArgs(
        cert.write.revokeCertificate([1n]),
        cert,
        "CertificateRevoked",
        [1n, getAddress(student.account.address), COURSE_ID],
      );
    });

    it("only removes the revoked token, leaving the rest of the list intact", async function () {
      const { cert } = await deploy();
      // three certs for the same student+course → tokens [1, 2, 3]
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);

      await cert.write.revokeCertificate([2n]); // revoke the middle one

      const remaining = await cert.read.getStudentCertificates([student.account.address, COURSE_ID]);
      assert.equal(remaining.length, 2);
      assert.ok(remaining.includes(1n));
      assert.ok(remaining.includes(3n));
      assert.ok(!remaining.includes(2n));
    });

    it("reverts when a non-admin revokes", async function () {
      const { cert } = await deploy();
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);
      const certAsOutsider = await asOutsider(cert.address);
      await viem.assertions.revertWithCustomError(
        certAsOutsider.write.revokeCertificate([1n]),
        cert,
        "AccessControlUnauthorizedAccount",
      );
    });

    it("reverts when revoking a nonexistent token", async function () {
      const { cert } = await deploy();
      await viem.assertions.revertWithCustomError(
        cert.write.revokeCertificate([999n]),
        cert,
        "ERC721NonexistentToken",
      );
    });

    it("never reuses a burned token id (counter only increments)", async function () {
      const { cert } = await deploy();
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);
      await cert.write.revokeCertificate([1n]);

      // the next mint is id 2, not a recycled id 1
      await cert.write.mint([student2.account.address, COURSE_ID, META_HASH, URI]);
      assert.equal(getAddress(await cert.read.ownerOf([2n])), getAddress(student2.account.address));

      // the burned id stays permanently dead
      await viem.assertions.revertWithCustomError(
        cert.read.ownerOf([1n]),
        cert,
        "ERC721NonexistentToken",
      );
    });
  });

  describe("admin management", function () {
    it("lets DEFAULT_ADMIN add an admin who can then mint", async function () {
      const { cert } = await deploy();
      await cert.write.addAdmin([outsider.account.address]);
      const certAsOutsider = await asOutsider(cert.address);
      await certAsOutsider.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);
      assert.equal(getAddress(await cert.read.ownerOf([1n])), getAddress(student.account.address));
    });

    it("lets DEFAULT_ADMIN remove an admin who can then no longer mint", async function () {
      const { cert } = await deploy();
      await cert.write.addAdmin([outsider.account.address]);
      await cert.write.removeAdmin([outsider.account.address]);
      const certAsOutsider = await asOutsider(cert.address);
      await viem.assertions.revertWithCustomError(
        certAsOutsider.write.mint([student.account.address, COURSE_ID, META_HASH, URI]),
        cert,
        "AccessControlUnauthorizedAccount",
      );
    });

    it("reverts when a non-DEFAULT_ADMIN adds an admin", async function () {
      const { cert } = await deploy();
      const certAsOutsider = await asOutsider(cert.address);
      await viem.assertions.revertWithCustomError(
        certAsOutsider.write.addAdmin([outsider.account.address]),
        cert,
        "AccessControlUnauthorizedAccount",
      );
    });
  });

  describe("upgrade authorization", function () {
    it("reverts when a non-admin upgrades", async function () {
      const { cert } = await deploy();
      const implV2 = await viem.deployContract("CourseCertificate");
      const certAsOutsider = await asOutsider(cert.address);
      await viem.assertions.revertWithCustomError(
        certAsOutsider.write.upgradeToAndCall([implV2.address, "0x"]),
        cert,
        "AccessControlUnauthorizedAccount",
      );
    });

    it("lets the admin upgrade and preserves state", async function () {
      const { cert } = await deploy();
      await cert.write.mint([student.account.address, COURSE_ID, META_HASH, URI]);

      const implV2 = await viem.deployContract("CourseCertificate");
      await cert.write.upgradeToAndCall([implV2.address, "0x"]);

      // existing token survives the upgrade
      assert.equal(getAddress(await cert.read.ownerOf([1n])), getAddress(student.account.address));
      // counter persisted: the next mint is id 2, not a reset to 1
      await cert.write.mint([student2.account.address, COURSE_ID, META_HASH, URI]);
      assert.equal(getAddress(await cert.read.ownerOf([2n])), getAddress(student2.account.address));
    });
  });

  describe("ERC-165", function () {
    it("advertises the expected interfaces", async function () {
      const { cert } = await deploy();
      assert.equal(await cert.read.supportsInterface(["0x01ffc9a7"]), true); // ERC-165
      assert.equal(await cert.read.supportsInterface(["0x80ac58cd"]), true); // ERC-721
      assert.equal(await cert.read.supportsInterface(["0x5b5e139f"]), true); // ERC-721 Metadata
      assert.equal(await cert.read.supportsInterface(["0x7965db0b"]), true); // IAccessControl
      assert.equal(await cert.read.supportsInterface(["0xffffffff"]), false);
    });
  });
});
