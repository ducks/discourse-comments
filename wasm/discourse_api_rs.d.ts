/* tslint:disable */
/* eslint-disable */
export class WasmDiscourseClient {
  free(): void;
  [Symbol.dispose](): void;
  constructor(base_url: string);
  static withApiKey(base_url: string, api_key: string, api_username: string): WasmDiscourseClient;
  static withUserApiKey(base_url: string, user_api_key: string): WasmDiscourseClient;
  getLatest(): Promise<any>;
  getTopic(topic_id: bigint): Promise<any>;
  createTopic(title: string, raw: string, category_id?: bigint | null): Promise<any>;
  createPost(topic_id: bigint, raw: string, reply_to_post_number?: number | null): Promise<any>;
  updatePost(post_id: bigint, raw: string): Promise<void>;
  deletePost(post_id: bigint): Promise<void>;
  likePost(post_id: bigint): Promise<void>;
  unlikePost(post_id: bigint): Promise<void>;
  getCategories(): Promise<any>;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmdiscourseclient_free: (a: number, b: number) => void;
  readonly wasmdiscourseclient_new: (a: number, b: number) => number;
  readonly wasmdiscourseclient_withApiKey: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly wasmdiscourseclient_withUserApiKey: (a: number, b: number, c: number, d: number) => number;
  readonly wasmdiscourseclient_getLatest: (a: number) => any;
  readonly wasmdiscourseclient_getTopic: (a: number, b: bigint) => any;
  readonly wasmdiscourseclient_createTopic: (a: number, b: number, c: number, d: number, e: number, f: number, g: bigint) => any;
  readonly wasmdiscourseclient_createPost: (a: number, b: bigint, c: number, d: number, e: number) => any;
  readonly wasmdiscourseclient_updatePost: (a: number, b: bigint, c: number, d: number) => any;
  readonly wasmdiscourseclient_deletePost: (a: number, b: bigint) => any;
  readonly wasmdiscourseclient_likePost: (a: number, b: bigint) => any;
  readonly wasmdiscourseclient_unlikePost: (a: number, b: bigint) => any;
  readonly wasmdiscourseclient_getCategories: (a: number) => any;
  readonly wasm_bindgen__convert__closures_____invoke__h64ae93ef5b2a9b55: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__hc81de2f9cad50252: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h8008ee203a578cbf: (a: number, b: number) => void;
  readonly wasm_bindgen__closure__destroy__hf74f3ceab70b8ccb: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h5342c721a7633e3d: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
