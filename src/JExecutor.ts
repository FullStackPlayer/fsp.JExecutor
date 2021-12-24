/**
 * JExecutor 用于为单个 JRequest 执行查询
 */
 
import NiceError from "./NiceError.ts";
import { JRequest } from "./JRequest.ts";
import { SchemaTypes, vjs } from "./JSchema.ts";

// 错误类型
enum ErrorType {
    INIT_ERROR = 'InitError',
    JSON_CHECK_ERROR = 'JsonCheckError',
    INST_ERROR = 'InstError',
    EXECUTION_ERROR = 'ExecutionError',
    ADAPTER_ERROR = 'AdapterError'
}

// 错误描述
enum ErrorInfo {
    JCONFIG_INITIALIZATION_FAILED = 'JConfig Initialization Failed',
    JEXECUTOR_INITIALIZATION_FAILED = 'JExecutor Initialization Failed',
    NOT_VALID_JCONFIG_JSON_OBJECT = 'Not Valid JConfig Json Object',
    NOT_VALID_JEXECUTOR_JSON_OBJECT = 'Not Valid JExecutor Json Object',
    JEXECUTOR_METHOD_EXECUTE_FAILED = 'JExecutor Method execute() Failed',
    ADAPTER_NOT_READY = 'Adapter Not Ready'
}

// 状态枚举
export enum AdapterStatus {
    UNSET = 'unset',
    READY = 'ready',
    ERROR = 'error'
}

// 执行器
export class JExecutor {
    adapter: IJAdapter
    config?: JConfig
    constructor(adapter: IJAdapter, config?: { [key: string]: any }, path?: string[]) {
        let chain = (path === undefined) ? [] : JSON.parse(JSON.stringify(path))
        chain.push(`JExecutor:constructor`)
        this.adapter = adapter
        if (config !== undefined) {
            try {
                this.config = new JConfig(config,chain)
            }
            catch (err) {
                throw new NiceError(ErrorInfo.JEXECUTOR_INITIALIZATION_FAILED , {
                    name: ErrorType.INIT_ERROR,
                    chain,
                    cause: new NiceError(ErrorInfo.NOT_VALID_JEXECUTOR_JSON_OBJECT , {
                        name: ErrorType.JSON_CHECK_ERROR,
                        chain,
                        cause: err
                    })
                })
            }
        }
    }
    // 执行指令
    async execute(request: JRequest, path?: string[]) : Promise<{ [key: string]: any }> {
        let chain = (path === undefined) ? [] : JSON.parse(JSON.stringify(path))
        chain.push(`JExecutor:execute()`)
        if (this.adapter.status === AdapterStatus.READY) {
            try {
                return await this.adapter.process(request,this.config)
            }
            catch (err) {
                throw new NiceError(ErrorInfo.JEXECUTOR_METHOD_EXECUTE_FAILED , {
                    name: ErrorType.EXECUTION_ERROR,
                    chain,
                    cause: err
                })
            }
        }
        else {
            throw new NiceError(ErrorInfo.ADAPTER_NOT_READY , {
                name: ErrorType.ADAPTER_ERROR,
                chain
            })
        }
    }
}

// config 校验
const configSchema = {
    type: SchemaTypes.OBJECT,
    properties: {
        printSql: { type: SchemaTypes.BOOLEAN },
        autoTimestamp: { type: SchemaTypes.BOOLEAN },
        decorator: { type: SchemaTypes.FUNCTION },
        recognizer: { type: SchemaTypes.FUNCTION },
        doorman: { type: SchemaTypes.FUNCTION },
        scanner: { type: SchemaTypes.FUNCTION },
        cacher: { type: SchemaTypes.FUNCTION },
        dispatcher: { type: SchemaTypes.FUNCTION },
    },
    additionalProperties: false
}

// 执行器配置
export class JConfig {
    printSql?: boolean = true
    autoTimestamp?: boolean = true
    decorator?: Function
    recognizer?: Function
    doorman?: Function
    scanner?: Function
    cacher?: Function
    dispatcher?: Function
    constructor(json?: { [key: string]: any }, path?: string[]) {
        if (json !== undefined) {
            let chain = (path === undefined) ? [] : JSON.parse(JSON.stringify(path))
            chain.push(`JConfig:constructor`)
            try {
                // 输入的 json 格式校验
                vjs(json,configSchema,{},chain)
                // 拷贝属性
                Object.assign(this,json)
            }
            catch (err) {
                throw new NiceError(ErrorInfo.JCONFIG_INITIALIZATION_FAILED , {
                    name: ErrorType.INIT_ERROR,
                    chain,
                    cause: new NiceError(ErrorInfo.NOT_VALID_JCONFIG_JSON_OBJECT , {
                        name: ErrorType.JSON_CHECK_ERROR,
                        chain,
                        cause: err
                    })
                })
            }
        }
    }
}

// 适配器接口，开发者可以自己实现适配不同数据源
export interface IJAdapter {
    client: any
    config: { [key: string]: any }
    status: AdapterStatus
    logs: Array<{ dt: Date, info: string }>
    connect() : Promise<void>
    process(req: JRequest, cfg?: JConfig): Promise<{ [key: string]: any }>
}
