import { assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";
import { JExecutor, JConfig, JRequest, SecurityMode, IJAdapter, AdapterStatus } from "../../mod.ts";
import { assertError, tryCatch } from "./Tools.ts"

// 测试 Security 对象的封装
Deno.test(
    'JExecutor Constructor',
    async () => {
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
        // 错误的 config 参数
        assertError(()=>{
            return new JExecutor(adpt, {
                notExists: true
            })
        },
        `[InitError@JExecutor:constructor]: JExecutor Initialization Failed <= [JsonCheckError@JExecutor:constructor]: Not Valid JExecutor Json Object <= [InitError@JExecutor:constructor/JConfig:constructor]: JConfig Initialization Failed <= [JsonCheckError@JExecutor:constructor/JConfig:constructor]: Not Valid JConfig Json Object <= [ValidationError@JExecutor:constructor/JConfig:constructor/validate:object]: Validation Failed <= [ObjectValidationError@JExecutor:constructor/JConfig:constructor/validate:object]: Object Validation Failed <= [RestrictionError@JExecutor:constructor/JConfig:constructor/validate:object/properties]: Properties Restriction Not Satisfied <= [InvalidPropertyError@JExecutor:constructor/JConfig:constructor/validate:object/properties:notExists]: Property Not Allowed`)
        // request 内容错误
        assertError(async ()=>{
            let exe = new JExecutor(adpt)
            let request = new JRequest({})
            let res = await exe.execute(request)
            return res instanceof Object
        },
        `[InitError@JRequest:constructor]: JRequest Initialization Failed <= [JsonCheckError@JRequest:constructor]: Not Valid JRequest Json Object <= [ValidationError@JRequest:constructor/validate:object]: Validation Failed <= [ObjectValidationError@JRequest:constructor/validate:object]: Object Validation Failed <= [RestrictionError@JRequest:constructor/validate:object/properties]: Properties Restriction Not Satisfied <= [ValidationError@JRequest:constructor/validate:object/properties:commands/validate:array]: Validation Failed <= [TargetMissingError@JRequest:constructor/validate:object/properties:commands/validate:array/required]: Target Required, but we got 'undefined'`)
        // 正常运作
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
        assertEquals(res.commands.length,1)
    }
)
