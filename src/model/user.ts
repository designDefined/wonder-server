import {Document, Schema, model, connect} from 'mongoose';

// 1. Create an interface representing a document in MongoDB.
export interface UserDocument extends Document {
    platformType: string;
    name: string;
    nickname?: string;
    phoneNumber?: string;
    email: string;
    created_at: Date;
    last_modified_at: Date
}

// 2. Create a Schema corresponding to the document interface.
const UserSchema = new Schema<UserDocument>({
    name:{type:String, required:true    }

});

// 3. Create a Model.
const User = model('User', UserSchema);
