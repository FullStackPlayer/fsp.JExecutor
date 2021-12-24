const { JExecutor, JConfig, IJAdapter, AdapterStatus } = require("../../dist/cjs/JExecutor.js");
const { JRequest, SecurityMode } = require("../../dist/cjs/JRequest.js");
const { assertError, assertEquals, tryCatch } = require("./Tools.js")

// 测试 Security 对象的封装
test(
    'JExecutor Constructor',
    async () => {
        let adpt = {
            client: {},
            config: {},
            status: AdapterStatus.READY,
            logs:[],
            async connect() {},
            async process(req, cfg) {
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
        // 正常运行
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
