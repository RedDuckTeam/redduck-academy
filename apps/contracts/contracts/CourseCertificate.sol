// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract CourseCertificate is
    Initializable,
    ERC721URIStorageUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct CertificateData {
        uint128 courseId;
        uint128 issuedAt;
        bytes32 metadataHash;
    }

    uint256 private _tokenIdCounter;

    // tokenId => certificate data
    mapping(uint256 => CertificateData) public certificates;

    // student => courseId => tokenIds
    mapping(address => mapping(uint256 => uint256[])) private _studentCourseTokens;

    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 indexed courseId,
        bytes32 metadataHash
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialAdmin) public initializer {
        __ERC721_init("RedDuck Academy Certificate", "Redduck");
        __ERC721URIStorage_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
    }

    /**
     * @notice Mint a certificate NFT to a student.
     * @param recipient  Student's wallet address.
     * @param courseId   Numeric course identifier.
     * @param metadataHash keccak256 hash of the metadata JSON (for tamper-proof verification).
     * @param metadataURI  IPFS/R2 URI pointing to the token JSON metadata.
     */
    function mint(
        address recipient,
        uint128 courseId,
        bytes32 metadataHash,
        string calldata metadataURI
    ) external onlyRole(ADMIN_ROLE) returns (uint256 tokenId) {
        return _mintCertificate(recipient, courseId, metadataHash, metadataURI);
    }

    /**
     * @notice Mint multiple certificate NFTs in one transaction. Gas cost scales linearly with batch size.
     * @param recipients    One recipient address per certificate.
     * @param courseIds       Course id per certificate (parallel to recipients).
     * @param metadataHashes  keccak256 hash of metadata JSON per certificate.
     * @param metadataURIs    Metadata URI per certificate.
     */
    function mintBatch(
        address[] calldata recipients,
        uint128[] calldata courseIds,
        bytes32[] calldata metadataHashes,
        string[] calldata metadataURIs
    ) external onlyRole(ADMIN_ROLE) returns (uint256[] memory tokenIds) {
        uint256 len = recipients.length;
        require(
            len > 0 &&
                len == courseIds.length &&
                len == metadataHashes.length &&
                len == metadataURIs.length,
            "CourseCertificate: invalid batch"
        );

        tokenIds = new uint256[](len);
        for (uint256 i = 0; i < len; ) {
            tokenIds[i] = _mintCertificate(
                recipients[i],
                courseIds[i],
                metadataHashes[i],
                metadataURIs[i]
            );
            unchecked {
                ++i;
            }
        }
    }

    function _mintCertificate(
        address recipient,
        uint128 courseId,
        bytes32 metadataHash,
        string memory metadataURI
    ) internal returns (uint256 tokenId) {
        tokenId = ++_tokenIdCounter;

        certificates[tokenId] = CertificateData({
            courseId: courseId,
            issuedAt: uint128(block.timestamp),
            metadataHash: metadataHash
        });

        _studentCourseTokens[recipient][courseId].push(tokenId);

        _mint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit CertificateMinted(tokenId, recipient, courseId, metadataHash);
    }

    /**
     * @notice Returns all certificate token IDs a student holds for a course.
     */
    function getStudentCertificates(address student, uint256 courseId)
        external
        view
        returns (uint256[] memory)
    {
        return _studentCourseTokens[student][courseId];
    }

    /**
     * @notice Verify that a student holds at least one valid certificate for a course.
     * @return valid    True if the student owns at least one certificate.
     * @return tokenId  The most recently issued token ID (0 if none).
     * @return metadataHash  The metadata hash of the most recently issued certificate.
     */
    function verifyCertificate(address student, uint256 courseId)
        external
        view
        returns (bool valid, uint256 tokenId, bytes32 metadataHash)
    {
        uint256[] storage tokens = _studentCourseTokens[student][courseId];
        if (tokens.length == 0) return (false, 0, bytes32(0));
        tokenId = tokens[tokens.length - 1];
        valid = ownerOf(tokenId) == student;
        metadataHash = certificates[tokenId].metadataHash;
    }

    // ── Soulbound: block all transfers ──────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        // Allow minting (from == 0) and burning (to == 0), block transfers
        require(from == address(0) || to == address(0), "Soulbound: non-transferable");
        return super._update(to, tokenId, auth);
    }

    // ── Admin management ────────────────────────────────────────────────────

    function addAdmin(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ADMIN_ROLE, account);
    }

    function removeAdmin(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ADMIN_ROLE, account);
    }

    // ── Upgrade authorization ───────────────────────────────────────────────

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}

    // ── Interface support ───────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorageUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
