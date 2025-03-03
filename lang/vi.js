const { set, version } = require("mongoose");
const about = require("../commands/about");

module.exports = {
    commands: {
        listcodes: {
            title: 'Mã code đang hoạt động cho {game}',
            noCodes: 'Không tìm thấy mã code nào đang hoạt động cho {game}',
            reward: 'Phần thưởng: {reward}',
            status: 'Trạng thái: {status}',
            redeemButton: 'Nhấn để nhận',
            redeemHeader: 'Nhận code tại đây',
            error: {
                fetch: 'Lỗi khi lấy mã code. Vui lòng thử lại sau.',
                invalid: 'Phản hồi không hợp lệ từ API',
                notFound: 'Không có mã code khả dụng'
            },
            loading: 'Đang tải mã code...',
            newCodes: 'Mã code mới cho {game}!',
            noReward: 'Chưa có thông tin phần thưởng'
        },
        setup: {
            description: 'Thiết lập role và kênh cho thông báo code',
            genshinRole: 'Role cho thông báo Genshin Impact',
            hsrRole: 'Role cho thông báo Honkai: Star Rail',
            zzzRole: 'Role cho thông báo Zenless Zone Zero',
            channel: 'Kênh nhận thông báo code',
            success: 'Cài đặt máy chủ thành công!',
            error: 'Cài đặt thất bại',
            roleSetup: 'Đã thiết lập role {role} cho thông báo {type}',
            channelSetup: 'Kênh {channel} sẽ nhận thông báo code'
        },
        redeem: {
            modalTitle: 'Thêm mã code',
            inputLabels: {
                games: 'Chọn Game (genshin/hsr/zzz)',
                code1: 'Code 1 (Bắt buộc)',
                code2: 'Code 2 (Tùy chọn)',
                code3: 'Code 3 (Tùy chọn)',
                message: 'Tin nhắn bổ sung (Tùy chọn)'
            },
            description: 'Hiển thị hướng dẫn và mã đổi thưởng',
            success: 'Đã đăng code thành công!',
            error: 'Đã xảy ra lỗi khi xử lý lệnh',
            noPermission: 'Bạn không có quyền sử dụng lệnh này',
            embedTitle: 'Mã code mới đã được đổi',
            embedDescription: 'Mã code mới đã được đổi cho {game}!',
            messageLabel: 'Tin nhắn:',
            redeemButton: 'Nhấn để nhận'
        },
        toggleautosend: {
            loading: 'Đang cập nhật cài đặt tự động gửi...',
            success: 'Tự động gửi hiện đang: **{status}**',
            error: 'Không thể cập nhật cài đặt tự động gửi'
        },
        setlang: {
            success: 'Ngôn ngữ của bot đã thành: **{language}**',
            error: 'Không thể cài đặt ngôn ngữ cho máy chủ',
            description: 'Cài đặt ngôn ngữ cho bot trong máy chủ',
            languageOption: 'Chọn ngôn ngữ'
        },
        vote: {
            title: 'Bình chọn cho HoYo Code Sender',
            description: 'Hãy ủng hộ chúng tôi bằng cách bình chọn trên Top.gg! Phiếu bầu của bạn giúp chúng tôi phát triển và tiếp cận nhiều người dùng hơn.',
            status: 'Trạng thái bình chọn',
            hasVoted: '✅ Cảm ơn bạn đã bình chọn! Bạn có thể bình chọn lại sau 12 giờ.',
            hasNotVoted: '❌ Bạn chưa bình chọn hôm nay!',
            link: 'Bình chọn tại đây',
            error: 'Lỗi kiểm tra trạng thái bình chọn. Vui lòng thử lại.'
        },
        about: {
            title: 'Về HoYo Code Sender',
            description: 'HoYo Code Sender là bot Discord tự động thông báo mã code mới cho Genshin Impact, Honkai: Star Rail và Zenless Zone Zero của Hoyovers.',
            version: 'Phiên bản:',
            inviteLink: 'Link Mời',
            supportServer: 'Server Hỗ Trợ',
            vote: 'Bình chọn cho bot',
            github: 'Kho mã nguồn GitHub',
            devbio: 'Tiểu sử nhà phát triển',
            donate: 'Ủng hộ tôi nếu trong nước thì có thể donate qua tiểu sử'
        },
    },
    errors: {
        general: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        api: 'Lỗi kết nối tới API',
        database: 'Đã xảy ra lỗi cơ sở dữ liệu',
        invalidChannel: 'Lỗi: Không tìm thấy kênh đã cấu hình',
        noConfig: 'Lỗi: Kênh chưa được cấu hình cho máy chủ này',
        rateLimit: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
    },
    system: {
        startup: 'Bot đang khởi động...',
        ready: 'Bot đã sẵn sàng!',
        checking: 'Đang kiểm tra code mới...',
        connected: 'Đã kết nối tới cơ sở dữ liệu',
        disconnected: 'Đã ngắt kết nối khỏi cơ sở dữ liệu'
    },
};