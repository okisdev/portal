import mongoose, { type Mongoose, type Model } from 'mongoose';
import type { Account as AdapterAccount } from 'next-auth';
import type { Adapter, AdapterSession, AdapterUser, VerificationToken as AdapterVerificationToken } from 'next-auth/adapters';

export function MongooseAdapter(dbConnect: Promise<Mongoose>): Adapter {
  // Load Models
  if (!mongoose.models.User) {
    require('./models/User');
  }
  if (!mongoose.models.Account) {
    require('./models/Account');
  }
  if (!mongoose.models.Session) {
    require('./models/Session');
  }
  if (!mongoose.models.VerificationToken) {
    require('./models/VerificationToken');
  }

  const User = mongoose.models.User as Model<AdapterUser>;
  const Account = mongoose.models.Account as Model<AdapterAccount>;
  const Session = mongoose.models.Session as Model<AdapterSession>;
  const VerificationToken = mongoose.models.VerificationToken as Model<AdapterVerificationToken>;

  return {
    async createUser(data) {
      await dbConnect;
      const user = await User.create(data);
      const userObject = user.toObject();
      return { ...userObject, id: user._id.toString() } as AdapterUser;
    },
    async getUser(id) {
      await dbConnect;
      const user = await User.findById(id);
      if (!user) return null;
      const userObject = user.toObject();
      return { ...userObject, id: user._id.toString() } as AdapterUser;
    },
    async getUserByEmail(email) {
      await dbConnect;
      const user = await User.findOne({ email });
      if (!user) return null;
      const userObject = user.toObject();
      return { ...userObject, id: user._id.toString() } as AdapterUser;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      await dbConnect;
      const account = await Account.findOne({ providerAccountId, provider });
      if (!account) return null;
      const user = await User.findById(account.userId);
      if (!user) return null;
      const userObject = user.toObject();
      return { ...userObject, id: user._id.toString() } as AdapterUser;
    },
    async updateUser({ id, ...data }) {
      await dbConnect;
      const user = await User.findByIdAndUpdate(id, data, { new: true });
      if (!user) throw new Error('User not found');
      const userObject = user.toObject();
      return { ...userObject, id: user._id.toString() } as AdapterUser;
    },
    async deleteUser(userId) {
      await dbConnect;
      await Promise.all([Account.deleteMany({ userId }), Session.deleteMany({ userId }), User.findByIdAndDelete(userId)]);
    },
    async linkAccount(data) {
      await dbConnect;
      const account = await Account.create(data);
      return undefined;
    },
    async unlinkAccount({ providerAccountId, provider }) {
      await dbConnect;
      await Account.findOneAndDelete({ providerAccountId, provider });
    },
    async createSession(data) {
      await dbConnect;
      const session = await Session.create(data);
      const sessionObject = session.toObject();
      return { ...sessionObject, id: session._id.toString() } as AdapterSession;
    },
    async getSessionAndUser(sessionToken) {
      await dbConnect;
      const session = await Session.findOne({ sessionToken });
      if (!session) return null;
      const user = await User.findById(session.userId);
      if (!user) return null;
      const userObject = user.toObject();
      const sessionObject = session.toObject();
      return {
        session: { ...sessionObject, id: session._id.toString() } as AdapterSession,
        user: { ...userObject, id: user._id.toString() } as AdapterUser,
      };
    },
    async updateSession(data) {
      await dbConnect;
      const session = await Session.findOneAndUpdate({ sessionToken: data.sessionToken }, data, { new: true });
      if (!session) return null;
      const sessionObject = session.toObject();
      return { ...sessionObject, id: session._id.toString() } as AdapterSession;
    },
    async deleteSession(sessionToken) {
      await dbConnect;
      await Session.findOneAndDelete({ sessionToken });
    },
    async createVerificationToken(data) {
      await dbConnect;
      const verificationToken = await VerificationToken.create(data);
      return verificationToken.toObject() as AdapterVerificationToken;
    },
    async useVerificationToken({ identifier, token }) {
      await dbConnect;
      const verificationToken = await VerificationToken.findOneAndDelete({
        identifier,
        token,
      });
      if (!verificationToken) return null;
      return verificationToken.toObject() as AdapterVerificationToken;
    },
  };
}

export default MongooseAdapter;
