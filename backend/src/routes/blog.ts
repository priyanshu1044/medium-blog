import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'

const blogRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string
		JWT_SECRET: string
	}
}>();

const TokenVerify = async (c: any,next: any) => {
	const headers = c.req.headers['authorization']
	//Bearer token
	const token = headers?.split(' ')[1]

	if (!token) {
		return c.json({error: 'No token provided'})
	}
	const user = await verify(token, c.env?.JWT_SECRET)

	if(user.id)	{
        c.set("userId", user.id);
		return next()
	}else{
		return c.status(403).json({error: 'Invalid token'})
	}
}

blogRouter.post('/', TokenVerify, async(c) => {
    const body = await c.req.json()

	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate())

    try {
        const blog = await prisma.blog.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: 1
            }
        })
        return c.json({
            id:blog.id
        })
    } catch (error) {
        console.log(error)
        c.status(411)
        return c.json("Invalid")
    }

})

blogRouter.put('/', TokenVerify, async(c) => {
    const body = await c.req.json()

	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate())

    try {
        const blog = await prisma.blog.update({
            where: {
                id: body.id
            }, 
            data: {
                title: body.title,
                content: body.content
            }
        })
        return c.json({
            id:blog.id
        })  
    } catch (error) {
        console.log(error)
        c.status(411)
        return c.json({'error':error})
    }
})


blogRouter.get('/', TokenVerify, async(c) => {
    const body = await c.req.json()

	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate())

    try {
        const blog = await prisma.blog.findFirst({
            where: {
                id: body.id
            }, 
        })
        return c.json({
            blog
        })
    } catch (error) {
        c.status
        return c.json({error,mssg:"Error while fetching the Blogs"})
        
    }
})

export default blogRouter;