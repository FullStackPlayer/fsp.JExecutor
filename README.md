# fsp.JExecutor
 
A JBDAP executor written in TypeScript, compatible with both Nodejs and Deno.

This is only a general wrapper, an adapter suits your own data source is required. We will provide an official MySQL adapter, take it to be an adapter example.

## Usage

~~~ts
import { JExecutor, JConfig, JRequest, SecurityMode, IJAdapter, AdapterStatus } from "../../mod.ts";
// adpt should be an instance of an adapter which implements IJAdapter
// here we just define an IJAdapter compatible object for demo purpose
let adpt: IJAdapter = {
    client: {},
    config: {},
    status: AdapterStatus.UNSET,
    logs:[],
    async connect() {},
    async process(req: JRequest, cfg: JConfig) {
        return req
    }
}
let exe = new JExecutor(adpt)
let request = new JRequest({
    commands: [
        {
            name: 'users',
            type: 'list',
            target: 'User',
            fields: `id,lastName=>name`
        }
    ]
})
let res = await exe.execute(request)
~~~

