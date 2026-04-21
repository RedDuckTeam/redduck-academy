import { WagmiProvider } from 'wagmi'
import { Text } from '@/components/ui/text'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { wagmiConfig } from '@/constants/wallet-config'
import { AdminGeneralTab } from './admin-general-tab'
import { AdminUsersTab } from './admin-users-tab'
import { AdminCertificatesTab } from './admin-certificates-tab'

export function AdminPage() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <main className="mx-5 min-h-screen py-10 md:mx-[60px] flex flex-col gap-8">
        <Text variant="title-80" element="h1">
          Admin Panel
        </Text>

        <Tabs defaultValue="general" className="flex w-full flex-col gap-6">
          <TabsList variant="line" className="w-full max-w-lg justify-start">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-0">
            <AdminGeneralTab />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <AdminUsersTab />
          </TabsContent>

          <TabsContent value="certificates" className="mt-0">
            <AdminCertificatesTab />
          </TabsContent>
        </Tabs>
      </main>
    </WagmiProvider>
  )
}
