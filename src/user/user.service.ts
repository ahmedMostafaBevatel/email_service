import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  //   async createUser(email: string, password: string): Promise<User> {
  //     const user = new this.userModel({ email, password });
  //     return user.save();
  //   }

  async getAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}
