import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('CourseCertificate', (m) => {
  // `initialAdmin` MUST be set explicitly via a parameters JSON on mainnet
  // (e.g. ignition/parameters/main.json). The local-account default exists only
  // for local/Sepolia convenience and would be catastrophic on mainnet.
  const initialAdmin = m.getParameter('initialAdmin', m.getAccount(0));

  const implementation = m.contract('CourseCertificate');

  const initData = m.encodeFunctionCall(implementation, 'initialize', [
    initialAdmin,
  ]);

  const proxy = m.contract('UUPSProxy', [implementation, initData], {
    id: 'CourseCertificateProxy',
  });

  return { implementation, proxy };
});
