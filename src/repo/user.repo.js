import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

class UserRepository {
    // Tìm người dùng theo ID
    async findById(id) {
        return User.findById(id);
        return await User.findById(id);
    }

    // Tìm người dùng theo username
    async findByUsername(username) {
        return User.findOne({ userName: username });
    }

    // Hàm tạo người dùng mặc định
    async createDefaultUsers() {
        try {
            // Kiểm tra người dùng đã tồn tại chưa
            const existingUser1 = await User.findOne({ userName: 'user1' });
            const existingUser2 = await User.findOne({ userName: 'user2' });

            // Nếu chưa có thì tạo mới với mật khẩu đã mã hóa
            if (!existingUser1) {
                const hashedPassword1 = await bcrypt.hash('password123', 10);
                const user1 = new User({
                    fullName: 'Nguyen Van C',
                    userName: 'user1',
                    phoneNumber: '0123456789',
                    email: 'user1@example.com',
                    gender: 'male',
                    passWord: hashedPassword1,
                    dob: new Date('1990-01-01'),
                    avatar: '',
                    status: 'active',
                    background: '',
                    is_twofa_enabled: false,
                    twofa_method: 'OTP_EMAIL',
                    is_visible_dob: 'FULL',
                    allow_message: 'EVERY_ONE',
                    allow_search_by_phone: true,
                    enable_fast_message: true,
                    list_fast_message: []
                });

                await user1.save();
                console.log('✅ User1 created');
            }

            if (!existingUser2) {
                const hashedPassword2 = await bcrypt.hash('password456', 10);
                const user2 = new User({
                    fullName: 'Nguyen Thi B',
                    userName: 'user2',
                    phoneNumber: '0987654321',
                    email: 'user2@example.com',
                    gender: 'female',
                    passWord: hashedPassword2,
                    dob: new Date('1995-05-10'),
                    avatar: '',
                    status: 'active',
                    background: '',
                    is_twofa_enabled: false,
                    twofa_method: 'OTP_EMAIL',
                    is_visible_dob: 'FULL',
                    allow_message: 'EVERY_ONE',
                    allow_search_by_phone: true,
                    enable_fast_message: true,
                    list_fast_message: []
                });

                await user2.save();
                console.log('✅ User2 created');
            }
        } catch (error) {
            console.error('❌ Error creating default users:', error);
        }
    }

}

const userRepository = new UserRepository();
export default userRepository;
