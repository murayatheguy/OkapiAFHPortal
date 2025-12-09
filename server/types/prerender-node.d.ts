declare module "prerender-node" {
  interface Prerender {
    set(key: string, value: string): Prerender;
  }
  const prerender: Prerender;
  export default prerender;
}
