import argon2 from 'argon2';
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from 'type-graphql';
import { getConnection } from 'typeorm';
import { v4 } from 'uuid';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { User } from '../entities/User';
import { sendEmail } from '../utils/sendEmail';
import { validateRegister } from '../utils/validateRegister';
import { MyContext } from './types';
import { UsernamePasswordInput } from './UsernamePasswordInput';

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { redis, req }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 3) {
            return {
                errors: [
                    {
                        field: 'newPassword',
                        message: 'password must be greater than 3 characters',
                    },
                ],
            };
        }

        const key = FORGET_PASSWORD_PREFIX + token;
        const userId = await redis.get(key);

        if (!userId) {
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'token expired',
                    },
                ],
            };
        }

        const userIdNum = parseInt(userId);
        const user = await User.findOne(userIdNum);

        if (!user) {
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'user no longer exists',
                    },
                ],
            };
        }

        await User.update(
            { id: userIdNum },
            {
                password: await argon2.hash(newPassword),
            }
        );

        await redis.del(key);

        // log in user after successfully changing password
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => Boolean)
    async forgotPassword(@Arg('email') email: string, @Ctx() { redis }: MyContext) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // email is not in database
            return true;
        }

        const token = v4();

        await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24 * 3); // expires after 3 days

        await sendEmail(
            email,
            `<a href="http://localhost:3000/change-password/${token}">Click here to reset your password</a>`
        );
        return true;
    }
    // check if logged in based on session cookie
    @Query(() => User, { nullable: true })
    me(@Ctx() { req }: MyContext) {
        if (!req.session.userId) {
            return null;
        }

        return User.findOne(req.session.userId);
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if (errors) {
            return { errors };
        }

        const hashedPassword = await argon2.hash(options.password);
        let user;
        try {
            const result = await getConnection()
                .createQueryBuilder()
                .insert()
                .into(User)
                .values({
                    username: options.username,
                    password: hashedPassword,
                    email: options.email,
                })
                .returning('*')
                .execute();
            user = result.raw[0];
        } catch (err) {
            // duplicate username error
            if (err.detail.includes('already exists')) {
                return {
                    errors: [
                        {
                            field: 'username',
                            message: 'username already taken',
                        },
                    ],
                };
            }
            console.log('message: ', err.message);
        }

        // store user id session
        // this will set a cookie on the user
        // and keeps them logged in after registering
        req.session.userId = user.id;
        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne(
            usernameOrEmail.includes('@')
                ? { where: { email: usernameOrEmail } }
                : { where: { username: usernameOrEmail } }
        );
        if (!user) {
            return {
                errors: [
                    {
                        field: 'usernameOrEmail',
                        message: 'that username does not exist',
                    },
                ],
            };
        }
        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'incorrect password',
                    },
                ],
            };
        }

        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                res.clearCookie(COOKIE_NAME);
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }
                return resolve(true);
            })
        );
    }
}
