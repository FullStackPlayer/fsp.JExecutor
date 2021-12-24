const { JCommand, CommandType, JQuery, JRequest, JSecurity, SecurityMode } = require("../../dist/cjs/JRequest.js")
const { assertError, assertEquals, tryCatch } = require("./Tools.js")

// 测试 Security 对象的封装
test('JSecurity Constructor', () => {
    const errorInfo = `[InitError@JSecurity:constructor]: JSecurity Initialization Failed <= [JsonCheckError@JSecurity:constructor]: Not Valid JSecurity Json Object <= [ValidationError@JSecurity:constructor/validate:multiple]: Validation Failed <= [MultipleValidationError@JSecurity:constructor/validate:multiple]: Multiple Validation Failed <= [RestrictionError@JSecurity:constructor/validate:multiple/oneOf]: No One Matches`
    // 空对象
    assertError(()=>{
        return new JSecurity({})
    },
    errorInfo)
    // mode 设置错误
    assertError(()=>{
        return new JSecurity({
            mode: 'unknown'
        })
    },
    errorInfo)
    // login 模式缺少字段
    assertError(()=>{
        return new JSecurity({
            mode: 'login'
        })
    },
    errorInfo)
    // token 模式缺少字段
    assertError(()=>{
        return new JSecurity({
            mode: 'token'
        })
    },
    errorInfo)
    // custom 模式缺少字段
    assertError(()=>{
        return new JSecurity({
            mode: 'custom'
        })
    },
    errorInfo)
    // custom 模式 customData 格式错误
    assertError(()=>{
        return new JSecurity({
            mode: 'custom',
            customData: true
        })
    },
    errorInfo)
    // 不能匹配 mode 的字段
    assertError(()=>{
        return new JSecurity({
            mode: 'login',
            account: '',
            password: '',
            customData: {}
        })
    },
    errorInfo)
    assertError(()=>{
        return new JSecurity({
            mode: 'token',
            accessToken: '',
            account: '',
            password: '',
        })
    },
    errorInfo)
    assertError(()=>{
        return new JSecurity({
            mode: 'custom',
            customData: {},
            accessToken: '',
        })
    },
    errorInfo)
    // 正常
    let s = new JSecurity({
        mode: 'login',
        account: 'un1',
        password: 'pwd'
    })
    assertEquals(s.mode,SecurityMode.LOGIN)
    s = new JSecurity({
        mode: 'token',
        accessToken: 'abc',
    })
    assertEquals(s.mode,SecurityMode.TOKEN)
    s = new JSecurity({
        mode: 'custom',
        customData: {},
    })
    assertEquals(s.mode,SecurityMode.CUSTOM)
})

// 测试 Query 对象的封装
test('JQuery Constructor', () => {
    // 报错的情况
    const errorInfo = `[InitError@JQuery:constructor]: JQuery Initialization Failed <= [JsonCheckError@JQuery:constructor]: Not Valid JQuery Json Object <= [ValidationError@JQuery:constructor/validate:multiple]: Validation Failed <= [MultipleValidationError@JQuery:constructor/validate:multiple]: Multiple Validation Failed <= [RestrictionError@JQuery:constructor/validate:multiple/oneOf]: No One Matches`
    // where 设置错误
    assertError(()=>{
        return new JQuery({
            where: 'unknown'
        })
    },
    errorInfo)
    // 不该出现的字段
    assertError(()=>{
        return new JQuery({
            where: {},
            something: 1
        })
    },
    errorInfo)
    // order 设置错误
    assertError(()=>{
        return new JQuery({
            where: {},
            order: true
        })
    },
    errorInfo)
    // page/size 没有同时出现
    assertError(()=>{
        return new JQuery({
            where: {},
            order: 'id#desc',
            page: 1
        })
    },
    errorInfo)
    // page/size 设置错误
    // page 类型错误
    assertError(()=>{
        new JQuery({
            where: {},
            order: 'id#desc',
            page: true,
            size: 10
        })
    },
    errorInfo)
    // page 为 0
    assertError(()=>{
        new JQuery({
            where: {},
            order: 'id#desc',
            page: 0,
            size: 10
        })
    },
    errorInfo)
    // size 为负数
    assertError(()=>{
        new JQuery({
            where: {},
            order: 'id#desc',
            page: 1,
            size: -10
        })
    },
    errorInfo)
    // size 大于 1000
    assertError(()=>{
        new JQuery({
            where: {},
            order: 'id#desc',
            page: 1,
            size: 2000
        })
    },
    errorInfo)

    // 正常的情况
    // 空 where
    let s = new JQuery({
        where: {}
    })
    assertEquals(s.where,{})
    // 简单 where
    s = new JQuery({
        where: {
            'id': 100,
            'views#gte': 1000
        }
    })
    assertEquals(s.where['id'],100)
    assertEquals(s.where['views#gte'],1000)
    // 复杂 where
    s = new JQuery({
        where: {
            'id': 100,
            $and: {
                'views#gte': 1000,
                $or: {
                    'hearts#gte': 100,
                    'subs#gte': 100
                }
            }
        }
    })
    assertEquals(s.where['id'],100)
    assertEquals(s.where['$and']['$or']['subs#gte'],100)
    // 带有 order
    s = new JQuery({
        where: {
            'id': 100,
            'views#gte': 1000
        },
        order: 'id#desc'
    })
    assertEquals(s.order,'id#desc')
    s = new JQuery({
        where: {
            'id': 100,
            'views#gte': 1000
        },
        order: ['views#desc','hearts#desc']
    })
    assertEquals(s.order?.length,2)
    // 带有 page/size
    s = new JQuery({
        where: {
            'id': 100,
            'views#gte': 1000
        },
        order: 'id#desc',
        size: 20,
        page: 1
    })
    assertEquals(s.size,20)
})

// 测试 Command 对象的封装
test('JCommand Constructor', () => {
    // 报错的情况
    let errorInfo = `[InitError@JCommand:constructor]: JCommand Initialization Failed <= [JsonCheckError@JCommand:constructor]: Not Valid JCommand Json Object <= [ValidationError@JCommand:constructor/validate:multiple]: Validation Failed <= [MultipleValidationError@JCommand:constructor/validate:multiple]: Multiple Validation Failed <= [RestrictionError@JCommand:constructor/validate:multiple/oneOf]: No One Matches`
    // 空对象
    assertError(()=>{
        return new JCommand({})
    },
    errorInfo)
    // 各种参数错误
    {
        // 参数设置错误
        assertError(()=>{
            return new JCommand({
                name: 'unknown',
                target: true
            })
        },
        errorInfo)
        // 不该出现的字段
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.ENTITY,
                something: 1
            })
        },
        errorInfo)
        // type 设置错误
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: 'invalid',
            })
        },
        errorInfo)
        // onlyIf 错误
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.ENTITY,
                onlyIf: true
            })
        },
        errorInfo)
        // fields 错误
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.ENTITY,
                fields: {}
            })
        },
        errorInfo)
        // data 错误
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.ENTITY,
                data: ''
            })
        },
        errorInfo)
        // after 错误
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.ENTITY,
                after: {}
            })
        },
        errorInfo)
        // 参数规则不匹配的错误情况
        // entity 不能有 data
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.ENTITY,
                data: {}
            })
        },
        errorInfo)
        // values 不能有 data
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.VALUES,
                data: {}
            })
        },
        errorInfo)
        // values 必须有 fields
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.VALUES,
            })
        },
        errorInfo)
        // create 不能有 query
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.CREATE,
                query: {}
            })
        },
        errorInfo)
        // create 必须有 data
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.CREATE,
            })
        },
        errorInfo)
        // delete 必须有 query
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.DELETE,
            })
        },
        errorInfo)
        // delete 不能有 data
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.DELETE,
                data: {}
            })
        },
        errorInfo)
        // update 必须有 data
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.UPDATE,
            })
        },
        errorInfo)
        // update 不能有 fields
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.UPDATE,
                fields: '*'
            })
        },
        errorInfo)
        // function 不能有 fields
        assertError(()=>{
            return new JCommand({
                name: 'unknow',
                target: 'table1',
                type: CommandType.FUNCTION,
                fields: '*'
            })
        },
        errorInfo)
    }
    // 正常的情况
    {
        // 空 where
        let s = new JCommand({
            name: 'unknown',
            target: 'table1',
            type: CommandType.ENTITY,
        })
        assertEquals(s.name,'unknown')
        // 带有 onlyIf
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.ENTITY,
            onlyIf: {
                something: 1,
                $and: {
                    else: 0,
                    or: '1'
                }
            }
        })
        assertEquals(s.onlyIf?.something,1)
        // 带有 fields
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.ENTITY,
            fields: '*'
        })
        assertEquals(s.fields,'*')
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.ENTITY,
            fields: 'id'
        })
        assertEquals(s.fields,'id')
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.ENTITY,
            fields: 'f1=>a1'
        })
        assertEquals(s.fields,'f1=>a1')
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.ENTITY,
            fields: 'f1=>a1,f2'
        })
        assertEquals(s.fields,'f1=>a1,f2')
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.ENTITY,
            fields: ['*']
        })
        assertEquals(s.fields,['*'])
        s = new JCommand({
            name: 'unknow',
            target: 'User',
            type: CommandType.ENTITY,
            fields: ['*',{
                name: 'sub',
                target: 'blogs',
                type: CommandType.LIST,
                query: {
                    where: {
                        'userId': '$.id'
                    }
                }
            }]
        })
        assertEquals(s.fields?.length,2)
        // 带有 query
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.ENTITY,
            fields: ['*'],
            query: {}
        })
        assertEquals(s.query?.where,{})
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.ENTITY,
            fields: ['*'],
            query: {
                where: {
                    'userId': '$.id'
                }
            }
        })
        assertEquals(s.query?.where['userId'],'$.id')
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.ENTITY,
            fields: ['*'],
            query: {
                where: {
                    'userId': '$.id'
                },
                order: 'id#asc',
                page: 1,
                size: 10
            }
        })
        assertEquals(s.query?.order,'id#asc')
        // 有 data
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.CREATE,
            data: {}
        })
        assertEquals(s.data,{})
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.CREATE,
            data: [{
                un: 'admin',
                pass: '123456',
                isAdmin: true
            }]
        })
        assertEquals(s.data?.length,1)
        // 有 after
        s = new JCommand({
            name: 'unknow',
            target: 'table1',
            type: CommandType.ENTITY,
            fields: ['*'],
            after: [
                {
                    name: 'sub',
                    target: 'blogs',
                    type: CommandType.LIST,
                    query: {
                        where: {
                            'userId': '$.id'
                        }
                    }
                }
            ]
        })
        assertEquals(s.after?.length,1)
    }
})

// 测试 JRequest 对象的封装
test('JRequest Constructor', () => {
    // 各种错误情况
    {
        // 空对象
        assertError(()=>{
            return new JRequest({})
        },
        `[InitError@JRequest:constructor]: JRequest Initialization Failed <= [JsonCheckError@JRequest:constructor]: Not Valid JRequest Json Object <= [ValidationError@JRequest:constructor/validate:object]: Validation Failed <= [ObjectValidationError@JRequest:constructor/validate:object]: Object Validation Failed <= [RestrictionError@JRequest:constructor/validate:object/properties]: Properties Restriction Not Satisfied <= [ValidationError@JRequest:constructor/validate:object/properties:commands/validate:array]: Validation Failed <= [TargetMissingError@JRequest:constructor/validate:object/properties:commands/validate:array/required]: Target Required, but we got 'undefined'`)
        // 空 commands
        assertError(()=>{
            return new JRequest({
                commands: []
            })
        },
        `[InitError@JRequest:constructor]: JRequest Initialization Failed <= [JsonCheckError@JRequest:constructor]: Not Valid JRequest Json Object <= [ValidationError@JRequest:constructor/validate:object]: Validation Failed <= [ObjectValidationError@JRequest:constructor/validate:object]: Object Validation Failed <= [RestrictionError@JRequest:constructor/validate:object/properties]: Properties Restriction Not Satisfied <= [ValidationError@JRequest:constructor/validate:object/properties:commands/validate:array]: Validation Failed <= [ArrayValidationError@JRequest:constructor/validate:object/properties:commands/validate:array]: Array Validation Failed <= [RestrictionError@JRequest:constructor/validate:object/properties:commands/validate:array/minItemsCount|maxItemsCount]: Items Restriction Not Satisfied`)
        // 非合法 command 对象
        assertError(()=>{
            return new JRequest({
                commands: [
                    {}
                ]
            })
        },
        `[InitError@JRequest:constructor]: JRequest Initialization Failed <= [JsonCheckError@JRequest:constructor]: Not Valid JRequest Json Object <= [ValidationError@JRequest:constructor/validate:object]: Validation Failed <= [ObjectValidationError@JRequest:constructor/validate:object]: Object Validation Failed <= [RestrictionError@JRequest:constructor/validate:object/properties]: Properties Restriction Not Satisfied <= [ValidationError@JRequest:constructor/validate:object/properties:commands/validate:array]: Validation Failed <= [ArrayValidationError@JRequest:constructor/validate:object/properties:commands/validate:array]: Array Validation Failed <= [RestrictionError@JRequest:constructor/validate:object/properties:commands/validate:array/items]: Items Restriction Not Satisfied <= [ValidationError@JRequest:constructor/validate:object/properties:commands/validate:array/items/validate:quotable]: Validation Failed <= [QuotableValidationError@JRequest:constructor/validate:object/properties:commands/validate:array/items/validate:quotable]: Quotable Validation Failed <= [ValidationError@JRequest:constructor/validate:object/properties:commands/validate:array/items/validate:quotable/validate:multiple]: Validation Failed <= [MultipleValidationError@JRequest:constructor/validate:object/properties:commands/validate:array/items/validate:quotable/validate:multiple]: Multiple Validation Failed <= [RestrictionError@JRequest:constructor/validate:object/properties:commands/validate:array/items/validate:quotable/validate:multiple/oneOf]: No One Matches`)
        // 非合法 Security 对象
        assertError(()=>{
            return new JRequest({
                commands: [
                    {
                        name: 'test',
                        target: 'User',
                        type: CommandType.ENTITY
                    }
                ],
                security: {}
            })
        },
        `[InitError@JRequest:constructor]: JRequest Initialization Failed <= [JsonCheckError@JRequest:constructor]: Not Valid JRequest Json Object <= [ValidationError@JRequest:constructor/validate:object]: Validation Failed <= [ObjectValidationError@JRequest:constructor/validate:object]: Object Validation Failed <= [RestrictionError@JRequest:constructor/validate:object/properties]: Properties Restriction Not Satisfied <= [ValidationError@JRequest:constructor/validate:object/properties:security/validate:quotable]: Validation Failed <= [QuotableValidationError@JRequest:constructor/validate:object/properties:security/validate:quotable]: Quotable Validation Failed <= [ValidationError@JRequest:constructor/validate:object/properties:security/validate:quotable/validate:multiple]: Validation Failed <= [MultipleValidationError@JRequest:constructor/validate:object/properties:security/validate:quotable/validate:multiple]: Multiple Validation Failed <= [RestrictionError@JRequest:constructor/validate:object/properties:security/validate:quotable/validate:multiple/oneOf]: No One Matches`)
        // 非合法 language
        assertError(()=>{
            return new JRequest({
                commands: [
                    {
                        name: 'test',
                        target: 'User',
                        type: CommandType.ENTITY
                    }
                ],
                language: 'test'
            })
        },
        `[InitError@JRequest:constructor]: JRequest Initialization Failed <= [JsonCheckError@JRequest:constructor]: Not Valid JRequest Json Object <= [ValidationError@JRequest:constructor/validate:object]: Validation Failed <= [ObjectValidationError@JRequest:constructor/validate:object]: Object Validation Failed <= [RestrictionError@JRequest:constructor/validate:object/properties]: Properties Restriction Not Satisfied <= [InvalidPropertyError@JRequest:constructor/validate:object/properties:language]: Property Not Allowed`)
    }

    // 正常
    let s = new JRequest({
        commands: [
            {
                name: 'test',
                target: 'User',
                type: CommandType.ENTITY
            }
        ]
    })
    assertEquals(s.commands.length,1)
    s = new JRequest({
        commands: [
            {
                name: 'test',
                target: 'User',
                type: CommandType.ENTITY
            }
        ],
        security: {
            mode: 'token',
            accessToken: 'abc',
        }
    })
    assertEquals(s.security?.mode,'token')
    s = new JRequest({
        commands: [
            {
                name: 'test',
                target: 'User',
                type: CommandType.ENTITY
            }
        ],
        security: {
            mode: 'token',
            accessToken: 'abc',
        },
        isTransaction: true
    })
    assertEquals(s.isTransaction,true)
})
