import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { verify } from 'hono/jwt';
import { updateBlogInput , createBlogInput } from '@priyanshu1044/medium-blog'

const blogRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string
		JWT_SECRET: string
	}, Variables:{
        userId: string
    }
}>();

const TokenVerify = async (c: any, next: any) => {
    const authHeader = c.req.header("authorization") || "";
    try {
        const user = await verify(authHeader, c.env.JWT_SECRET);
        if (user) {
            c.set("userId", user.id);
            await next();
        } else {
            c.status(403);
            return c.json({
                message: "You are not logged in"
            })
        }
    } catch(e) {
        c.status(403);
        return c.json({
            message: "You are not logged in"
        })
    }
};

blogRouter.post('/', TokenVerify, async (c) => {
    try {
        const { title, content } = await c.req.json();
        const userId = c.get("userId");

        const {success}=createBlogInput.safeParse({title,content})
        if(!success){
            c.status(411)
            return c.json("Input is not correct")
        }

        const prisma = new PrismaClient({
            datasourceUrl: c.env?.DATABASE_URL,
        }).$extends(withAccelerate());

        const blog = await prisma.blog.create({
            data: {
                title,
                content,
                authorId: Number(userId)
            }
        });
        return c.json({ id: blog.id });
    } catch (error) {
        console.error('Post request error:', error);
        c.status(500)
        return c.json({ error: 'Internal server error' });
    }
});

blogRouter.put('/', TokenVerify, async(c) => {
    const body = await c.req.json()
    const userId = c.get("userId");


    const {success}=updateBlogInput.safeParse(body)
    if(!success){
        c.status(411)
        return c.json("Input is not correct")
    }

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
                content: body.content,
                authorId: Number(userId)
            }
        })
        return c.json({
            id:blog.id,

            msg:`blog id: ${blog.id} is updated`
        })  
    } catch (error) {
        console.error('Put request error:', error);
        c.status(500)
        return c.json({'error':error})
    }
});

blogRouter.get('/bulk', TokenVerify, async(c) => {
    
    const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate())

    try {
        const blogs = await prisma.blog.findMany();
        return c.json({ blogs });
    } catch (error) {
        console.error('Bulk get request error:', error);
        c.status(500)
        return c.json({ error: 'Error while fetching blogs' });        
    }
});

blogRouter.get('/:id', TokenVerify, async(c) => {
    const id = c.req.param("id");

	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate())

    try {
        const blog = await prisma.blog.findFirst({
            where: {
                id: Number(id)
            }, 
        })
        return c.json({ blog });
    } catch (error) {
        console.error('Get request error:', error);
        c.status(500)
        return c.json({ error: 'Error while fetching the blog' });        
    }
});



export default blogRouter;
