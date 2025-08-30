import { defineConfig } from 'tsup'
import fs from 'fs-extra'

export default defineConfig({
  entry: ['alipay.js', 'wechat.js'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  async onSuccess() {
    await fs.copy('account_map.json', 'dist/account_map.json')
    await fs.copy('category_map.json', 'dist/category_map.json')
    await fs.copy('account_map.json', 'bin/account_map.json')
    await fs.copy('category_map.json', 'bin/category_map.json')
  }
})