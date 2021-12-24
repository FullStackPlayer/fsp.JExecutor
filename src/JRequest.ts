/**
 * jbdap 传输的请求
 */

import NiceError from "./NiceError.ts";
import { vjs, SchemaTypes, JSchemaBase } from "./JSchema.ts";

// 定义 Security 类型
export enum SecurityMode {
    LOGIN = 'login',
    TOKEN = 'token',
    CUSTOM = 'custom',
    UNSET = 'unset'
}

// 定义 Command 类型
export enum CommandType {
    CREATE = 'create',
    DELETE = 'delete',
    UPDATE = 'update',
    INCREASE = 'increase',
    DECREASE = 'decrease',
    LIST = 'list',
    ENTITY = 'entity',
    DISTINCT = 'distinct',
    VALUES = 'values',
    FUNCTION = 'function',
    UNSET = 'unset',
}

// 默认值枚举
export enum DefaultStrings {
    UNSET = 'unset',
    EMPTY = 'empty',
}

// 错误类型
enum ErrorType {
    INIT_ERROR = 'InitError',
    JSON_CHECK_ERROR = 'JsonCheckError',
    INST_ERROR = 'InstError',
}

// 错误描述
enum ErrorInfo {
    JREQUEST_INITIALIZATION_FAILED = 'JRequest Initialization Failed',
    JCOMMAND_INITIALIZATION_FAILED = 'JCommand Initialization Failed',
    JQUERY_INITIALIZATION_FAILED = 'JQuery Initialization Failed',
    JSECURITY_INITIALIZATION_FAILED = 'JSecurity Initialization Failed',
    NOT_VALID_JREQUEST_JSON_OBJECT = 'Not Valid JRequest Json Object',
    NOT_VALID_JCOMMAND_JSON_OBJECT = 'Not Valid JCommand Json Object',
    NOT_VALID_JQUERY_JSON_OBJECT = 'Not Valid JQuery Json Object',
    NOT_VALID_JSECURITY_JSON_OBJECT = 'Not Valid JSecurity Json Object',
}

// fields 规则
// 1、只有一个'*'：^\*{1}$
// 2、以','分割的字符串：
//       ^        [^\d\s\*\,=>]+                 [^\s\*\,=>]*          ([^\d\s\*\,=>]*(=>)?[^\d\s\*\,=>]+[^\s\*\,=>]*)?         ([\,]{1}[^\d\s\*\,=>]+[^\s\*\,=>]*([^\d\s\*\,=>]*(=>)?[^\d\s\*\,=>]+[^\s\*\,=>]*)?)*$
// 详解：  |- 不能以数字、空字符、保留字符开头 -|— 任意非空非','非'*'字符 -|—              后面可能还会有以'=>'分割的别名               -|-                                  再往后可能有以','分割的其它字段                              -|
// 老实讲，这个正则非常复杂，我都不知道自己是怎么写出来的：-（
// ^[^\d\s\*\,=>]+[^\s\*\,=>]*([^\d\s\*\,=>]*(=>)?[^\d\s\*\,=>]+[^\s\*\,=>]*)?([\,]{1}[^\d\s\*\,=>]+[^\s\*\,=>]*([^\d\s\*\,=>]*(=>)?[^\d\s\*\,=>]+[^\s\*\,=>]*)?)*$
// 3、数组中有字符串，就只能是单个字段的格式了，不允许用','分割，正则如下：
// ^[^\d\s\*\,=>]+[^\s\*\,=>]*([^\d\s\*\,=>]*(=>)?[^\d\s\*\,=>]+[^\s\*\,=>]*)?$
const fieldsSchemaOneOf = [
    // 纯字符串 - 1个星号
    {
        type: SchemaTypes.REGEXP,
        expression: /^\*{1}$/
    },
    // 纯字符串 - 支持用','分割的多个字段（允许别名）
    {
        type: SchemaTypes.REGEXP,
        expression: /^[^\d\s\*\,=>]+[^\s\*\,=>]*([^\d\s\*\,=>]*(=>)?[^\d\s\*\,=>]+[^\s\*\,=>]*)?([\,]{1}[^\d\s\*\,=>]+[^\s\*\,=>]*([^\d\s\*\,=>]*(=>)?[^\d\s\*\,=>]+[^\s\*\,=>]*)?)*$/
    },
    // 数组(元素可以是字符串或者 command)
    {
        type: SchemaTypes.ARRAY,
        items: [
            {
                type: SchemaTypes.MULTIPLE,
                oneOf: [
                    // 纯字符串 - 1个星号
                    {
                        type: SchemaTypes.REGEXP,
                        expression: /^\*{1}$/g
                    },
                    // 纯字符串 - 单字段支持别名设置
                    {
                        type: SchemaTypes.REGEXP,
                        expression: /^[^\d\s\*\,=>]+[^\s\*\,=>]*([^\d\s\*\,=>]*(=>)?[^\d\s\*\,=>]+[^\s\*\,=>]*)?$/
                    },
                    // command 对象 - 级联查询
                    {
                        type: SchemaTypes.QUOTABLE,
                        schema: '$commandSchema'
                    }
                ]
            }
        ],
        minItemsCount: 1
    },
]

// values 查询时，fields 是另外的规则
// 分为两类，一类括号中只能有单个字段，另一类括号中可以有多个字段
const valuesFieldsSchema = {
    required: true,
    type: SchemaTypes.ARRAY,
    items: [
        // count\sum\max\min\avg\first\pick 括号中只能有一个字段
        {
            type: SchemaTypes.REGEXP,
            expression: /^(count|sum|max|min|avg|first|pick)\([^\d\s\*\,=>]+[^\s\*\,=>]*\)=>[^\d\s\*\,=>]+[^\s\*\,#=>]*$/
        },
        // clone 括号中可以有多个字段
        {
            type: SchemaTypes.REGEXP,
            expression: /^clone\([^\d\s\*\,=>]+[^\s\*\,=>]*([\,]{1}[^\d\s\*\,=>]+[^\s\*\,=>]*)*\)=>[^\d\s\*\,=>]+[^\s\*\,#=>]*$/
        },
    ],
    minItemsCount: 1
}

// 定义 Security 的 Schema
const securitySchema = {
    type: SchemaTypes.MULTIPLE,
    oneOf: [
        {
            type: SchemaTypes.OBJECT,
            properties: {
                mode: {
                    type: SchemaTypes.ENUM,
                    required: true,
                    items: [SecurityMode.LOGIN]
                },
                account: { type: SchemaTypes.STRING, required: true },
                password: { type: SchemaTypes.STRING, required: true },
            },
            additionalProperties: false
        },
        {
            type: SchemaTypes.OBJECT,
            properties: {
                mode: {
                    type: SchemaTypes.ENUM,
                    required: true,
                    items: [SecurityMode.TOKEN]
                },
                accessToken: { type: SchemaTypes.STRING, required: true }
            },
            additionalProperties: false
        },
        {
            type: SchemaTypes.OBJECT,
            properties: {
                mode: {
                    type: SchemaTypes.ENUM,
                    required: true,
                    items: [SecurityMode.CUSTOM]
                },
                customData: {
                    type: SchemaTypes.OBJECT,
                    required: true
                },
            },
            additionalProperties: false
        }
    ]
}
// 定义 where 的 schema
const whereSchema = new JSchemaBase({
    type: SchemaTypes.OBJECT,
    required: true,
    properties: {
        $and: { type: SchemaTypes.QUOTABLE, schema: '$whereSchema' },
        $or: { type: SchemaTypes.QUOTABLE, schema: '$whereSchema' },
        $not: { type: SchemaTypes.QUOTABLE, schema: '$whereSchema' },
    }
})
// 定义 Query 的 Schema
const querySchema = {
    type: SchemaTypes.MULTIPLE,
    oneOf: [
        // 无分页
        {
            type: SchemaTypes.OBJECT,
            properties: {
                where: {
                    type: SchemaTypes.QUOTABLE,
                    schema: '$whereSchema',
                },
                order: {
                    type: SchemaTypes.MULTIPLE,
                    oneOf: [
                        { type: SchemaTypes.STRING, required: true },
                        {
                            type: SchemaTypes.ARRAY,
                            required: true,
                            items: { type: SchemaTypes.STRING }
                        }
                    ]
                }
            },
            additionalProperties: false
        },
        // 有分页
        {
            type: SchemaTypes.OBJECT,
            properties: {
                where: {
                    type: SchemaTypes.QUOTABLE,
                    schema: '$whereSchema',
                },
                order: {
                    type: SchemaTypes.MULTIPLE,
                    oneOf: [
                        { type: SchemaTypes.STRING, required: true },
                        {
                            type: SchemaTypes.ARRAY,
                            required: true,
                            items: { type: SchemaTypes.STRING }
                        }
                    ]
                },
                size: {
                    type: SchemaTypes.INTEGER,
                    required: true,
                    min: 0,
                    max: 1000
                },
                page: {
                    type: SchemaTypes.INTEGER,
                    required: true,
                    min: 1
                }
            },
            additionalProperties: false
        }
    ]
}
//
// 定义 Command 不同类型的 Schema（因为不同类型的操作对参数的要求不一样）
// 通用属性规则
const sharedProperties = {
    // 必备字段
    name: { type: SchemaTypes.STRING, required: true },
    target: { type: SchemaTypes.STRING, required: true },
    // 以下是可选字段
    layer: { type: SchemaTypes.INTEGER },
    return: { type: SchemaTypes.BOOLEAN },
    // 前置条件
    onlyIf: {
        type: SchemaTypes.QUOTABLE,
        schema: '$whereSchema'
    },
    // 后置行为（执行一系列 commands）
    after: {
        type: SchemaTypes.ARRAY,
        items: {
            type: SchemaTypes.QUOTABLE,
            schema: '$commandSchema'
        }
    }
}
// list/entity（可以有 fields，支持级联查询，可以有 query，不能有 data）
const queryCommandSchema = {
    type: SchemaTypes.OBJECT,
    properties: Object.assign({
        // 必备字段
        type: {
            type: SchemaTypes.ENUM,
            required: true,
            items: [CommandType.LIST,CommandType.ENTITY]
        },
        // 以下是可选字段
        fields: {
            type: SchemaTypes.MULTIPLE,
            // 支持字符串和数组
            oneOf: fieldsSchemaOneOf
        },
        // 可以有 query
        query: {
            type: SchemaTypes.QUOTABLE,
            schema: '$querySchema'
        },
    },sharedProperties),
    additionalProperties: false
}
// distinct（必须有 fields，不支持级联查询，可以有 query，不能有 data）
const distinctCommandSchema = {
    type: SchemaTypes.OBJECT,
    properties: Object.assign({
        // 必备字段
        type: {
            type: SchemaTypes.ENUM,
            required: true,
            items: [CommandType.DISTINCT]
        },
        // 以下是可选字段
        fields: {
            type: SchemaTypes.MULTIPLE,
            required: true,
            // 支持字符串和数组
            oneOf: fieldsSchemaOneOf
        },
        query: {
            type: SchemaTypes.QUOTABLE,
            schema: '$querySchema'
        },
    },sharedProperties),
    additionalProperties: false    
}
// values（必须有 fields，只支持字符串数组类型，可以有 query，不能 data）
const valuesCommandSchema = {
    type: SchemaTypes.OBJECT,
    properties: Object.assign({
        // 必备字段
        type: {
            type: SchemaTypes.ENUM,
            required: true,
            items: [CommandType.VALUES]
        },
        fields: valuesFieldsSchema,
        // 可以有 query
        query: {
            type: SchemaTypes.QUOTABLE,
            schema: '$querySchema'
        },
    },sharedProperties),
    additionalProperties: false    
}
// create（不能有 fields，不能有 query，必须有 data）
const createCommandSchema = {
    type: SchemaTypes.OBJECT,
    properties: Object.assign({
        // 三个必备字段
        type: {
            type: SchemaTypes.ENUM,
            required: true,
            items: [CommandType.CREATE]
        },
        // 必须有 data
        data: {
            type: SchemaTypes.MULTIPLE,
            required: true,
            // 可以是单个 object 或者 object 的数组
            oneOf: [
                { type: SchemaTypes.OBJECT },
                {
                    type: SchemaTypes.ARRAY,
                    items: { type: SchemaTypes.OBJECT }
                }
            ]
        },
    },sharedProperties),
    additionalProperties: false    
}
// delete（不能有 fields，不能有 data，安全起见必须有 query）
const deleteCommandSchema = {
    type: SchemaTypes.OBJECT,
    properties: Object.assign({
        // 必备字段
        type: {
            type: SchemaTypes.ENUM,
            required: true,
            items: [CommandType.DELETE]
        },
        // 必须有 query
        query: {
            type: SchemaTypes.QUOTABLE,
            required: true,
            schema: '$querySchema'
        },
    },sharedProperties),
    additionalProperties: false    
}
// update/increase/decrease（不能有 fields，必须有 data，可以有 query）
const updateCommandSchema = {
    type: SchemaTypes.OBJECT,
    properties: Object.assign({
        // 必备字段
        type: {
            type: SchemaTypes.ENUM,
            required: true,
            items: [CommandType.UPDATE, CommandType.INCREASE, CommandType.DECREASE]
        },
        // 可以有 query
        query: {
            type: SchemaTypes.QUOTABLE,
            schema: '$querySchema'
        },
        // 必须有 data
        data: {
            type: SchemaTypes.OBJECT,
            required: true
        },
    },sharedProperties),
    additionalProperties: false    
}
// function（不能有 fields，不能有 query，可以有 data）
const functionCommandSchema = {
    type: SchemaTypes.OBJECT,
    properties: Object.assign({
        // 必备字段
        type: {
            type: SchemaTypes.ENUM,
            required: true,
            items: [CommandType.FUNCTION]
        },
        // 可以有 data
        data: {
            type: SchemaTypes.MULTIPLE,
            // 可以是单个 object 或者 object 的数组
            oneOf: [
                { type: SchemaTypes.OBJECT },
                {
                    type: SchemaTypes.ARRAY,
                    items: { type: SchemaTypes.OBJECT }
                }
            ]
        },
    },sharedProperties),
    additionalProperties: false    
}
// 定义 Command 的 Schema
const commandSchema = {
    type: SchemaTypes.MULTIPLE,
    oneOf: [
        queryCommandSchema,
        createCommandSchema,
        updateCommandSchema,
        deleteCommandSchema,
        valuesCommandSchema,
        distinctCommandSchema,
        functionCommandSchema,
    ]
}
// 定义 JRequest 的 Schema
const JRequestSchema = {
    type: SchemaTypes.OBJECT,
    properties: {
        commands: {
            type: SchemaTypes.ARRAY,
            required: true,
            items: {
                type: SchemaTypes.QUOTABLE,
                schema: '$commandSchema'
            },
            minItemsCount: 1
        },
        security: {
            type: SchemaTypes.QUOTABLE,
            schema: '$securitySchema'
        },
        needLogs: { type: SchemaTypes.BOOLEAN },
        needTrace: { type: SchemaTypes.BOOLEAN },
        isTransaction: { type: SchemaTypes.BOOLEAN }
    },
    additionalProperties: false
}

// 定义引用集
const refs = {
    securitySchema,
    commandSchema,
    whereSchema,
    querySchema,
}

// 请求数据包
export class JRequest {
    commands: JCommand[] = []
    security?: JSecurity
    needLogs?: boolean = false
    needTrace?: boolean = false
    isTransaction?: boolean = false
    constructor(json: { [key: string]: any }, path?: string[]) {
        let chain = (path === undefined) ? [] : JSON.parse(JSON.stringify(path))
        chain.push(`JRequest:constructor`)
        try {
            // 校验 json 格式是否正确
            vjs(json,JRequestSchema,refs,chain)
            // 拷贝属性
            Object.assign(this,json)
            // 实例化 Commands
            for (let i=0; i<this.commands.length; i++) {
                this.commands[i] = new JCommand(this.commands[i],chain)
            }
            // 实例化 Security
            if (this.security) this.security = new JSecurity(this.security,chain)
        }
        catch (err) {
            throw new NiceError(ErrorInfo.JREQUEST_INITIALIZATION_FAILED , {
                name: ErrorType.INIT_ERROR,
                chain,
                cause: new NiceError(ErrorInfo.NOT_VALID_JREQUEST_JSON_OBJECT , {
                    name: ErrorType.JSON_CHECK_ERROR,
                    chain,
                    cause: err
                })
            })
        }
    }
}

// 单个请求指令
export class JCommand {
    name: string = DefaultStrings.UNSET
    type: CommandType = CommandType.UNSET
    target: string = DefaultStrings.UNSET
    layer: number = 1
    return?: boolean = true
    fields?: string | Array<string|JCommand>
    values?: Array<string>
    query?: JQuery
    data?: { [key: string]: any } | Array<{ [key: string]: any }>
    onlyIf?: { [key: string]: any }
    after?: JCommand[]
    constructor(json: { [key: string]: any }, path?: string[]) {
        let chain = (path === undefined) ? [] : JSON.parse(JSON.stringify(path))
        chain.push(`JCommand:constructor`)
        try {
            // 校验 json 格式是否正确
            vjs(json,commandSchema,refs,chain)
            // 拷贝属性
            Object.assign(this,json)
            // 实例化 fields 里的 JCommand
            if (this.fields instanceof Array) {
                for (let i=0; i<this.fields.length; i++) {
                    let item = this.fields[i]
                    if (typeof item !== 'string') item = new JCommand(item)
                }
            }
            // 实例化 query
            if (this.query) this.query = new JQuery(this.query)
            // 实例化 after
            if (this.after) {
                for (let i=0; i<this.after.length; i++) {
                    let item = this.after[i]
                    if (typeof item !== 'string') item = new JCommand(item)
                }
            }
        }
        catch (err) {
            throw new NiceError(ErrorInfo.JCOMMAND_INITIALIZATION_FAILED , {
                name: ErrorType.INIT_ERROR,
                chain,
                cause: new NiceError(ErrorInfo.NOT_VALID_JCOMMAND_JSON_OBJECT , {
                    name: ErrorType.JSON_CHECK_ERROR,
                    chain,
                    cause: err
                })
            })
        }
    }
}

// 查询指令
export class JQuery {
    where: { [key: string]: any } = {}
    order?: string | string[]
    size?: number
    page?: number
    constructor(json: { [key: string]: any }, path?: string[]) {
        let chain = (path === undefined) ? [] : JSON.parse(JSON.stringify(path))
        chain.push(`JQuery:constructor`)
        try {
            // 输入的 json 格式校验
            vjs(json,querySchema,refs,chain)
            // 拷贝属性
            Object.assign(this,json)
        }
        catch(err) {
            throw new NiceError(ErrorInfo.JQUERY_INITIALIZATION_FAILED , {
                name: ErrorType.INIT_ERROR,
                chain,
                cause: new NiceError(ErrorInfo.NOT_VALID_JQUERY_JSON_OBJECT , {
                    name: ErrorType.JSON_CHECK_ERROR,
                    chain,
                    cause: err
                })
            })
        }
    }
}

// 安全实体
export class JSecurity {
    mode: SecurityMode = SecurityMode.UNSET
    account?: string
    password?: string
    accessToken?: string
    customData?: { [key: string]: any }
    constructor(json: { [key: string]: any }, path?: string[]) {
        let chain = (path === undefined) ? [] : JSON.parse(JSON.stringify(path))
        chain.push(`JSecurity:constructor`)
        try {
            // 输入的 json 格式校验
            vjs(json,securitySchema,refs,chain)
            // 拷贝属性
            Object.assign(this,json)
        }
        catch (err) {
            // 捕获到异常，说明输入的 json 格式错误
            throw new NiceError(ErrorInfo.JSECURITY_INITIALIZATION_FAILED , {
                name: ErrorType.INIT_ERROR,
                chain,
                cause: new NiceError(ErrorInfo.NOT_VALID_JSECURITY_JSON_OBJECT , {
                    name: ErrorType.JSON_CHECK_ERROR,
                    chain,
                    cause: err
                })
            })
        }
    }
}

