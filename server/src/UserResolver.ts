import {Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx} from 'type-graphql'
import {hash, compare} from 'bcryptjs'
import {User} from "./entity/User"
import { MyContext } from './MyContext';
import { createRefreshToken, createAccessToken } from './auth';

@ObjectType()
class LoginResponse{
  @Field()
  accessToken: string
}

@Resolver()
export class UserResolver {
  @Query(()=>String)
  hello(){
    return 'hi!'
  }

  @Query(() => [User])
  Users() {
    return User.find()
  }

  //registation new user
  @Mutation(()=>Boolean)
  async register(
    @Arg('email') email: string,
    @Arg('password') password: string,
  ) {
    const hashedPassword = await hash(password, 12)
    try{
      await User.insert({
        email,
        password: hashedPassword
      })
    } catch(err) {
      console.log(err)
      return false
    }
    return true
  }

  //login 
  @Mutation(()=>LoginResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() {res}: MyContext,
  ): Promise<LoginResponse> {
    const user = await User.findOne( { where: {email} } )

    if (!user) {
      throw new Error('could not fins user')
    }

    const valid = await compare(password, user.password)
    if (!valid) {
      throw new Error('wrong password')
    }

    res.cookie( "jid", createRefreshToken(user), { httpOnly: true } )
    return {
      accessToken: createAccessToken(user)
    }
  }
}