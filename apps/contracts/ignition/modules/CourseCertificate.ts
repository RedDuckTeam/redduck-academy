import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('CourseCertificate', (m) => {
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
