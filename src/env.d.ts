// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    nonce: string;
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly dirname: string;
}
