/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ImportMap, ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap as rawImportMap } from './admin/importMap.js'
import './custom.scss'

// Cast widens the generated importMap to Payload's ImportMap, sidestepping a
// "excessive stack depth" tsc diagnostic that surfaces as more entries are added
const importMap = rawImportMap as unknown as ImportMap

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    // Payload accepts a Promise<SanitizedConfig>; TS narrows poorly here, and the
    // expanded importMap pushes the comparison past tsc's stack depth.
    config: config as never,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  // Same as above — `config` is awaited inside RootLayout.
  <RootLayout config={config as never} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
