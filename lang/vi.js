const { set, version } = require("mongoose");
const about = require("../commands/about");

module.exports = {
    games: {
        genshin: 'Genshin Impact',
        hkrpg: 'Honkai: Star Rail',
        nap: 'Zenless Zone Zero'
    },
    common: {
        enabled: 'BẬT',
        disabled: 'TẮT',
        notYourButton: 'Nút này không dành cho bạn.'
    },
    welcome: {
        title: 'Cảm ơn đã thêm HoYo Code Sender!',
        description: 'Cảm ơn đã thêm tôi vào máy chủ của bạn! Tôi sẽ giúp bạn nhận mã code game HoYoverse tự động.',
        setupHeader: '🔧 Hướng dẫn cài đặt nhanh',
        setupSteps: '1. Sử dụng lệnh `/setup` để cấu hình kênh thông báo & vai trò\n' +
                   '2. (Tùy chọn) Sử dụng `/favgames` để chọn game bạn muốn nhận mã code\n' +
                   '3. (Tùy chọn) Thay đổi ngôn ngữ với `/setlang`\n\n' +
                   'Chỉ vậy thôi! Tôi sẽ tự động gửi mã code game mới đến kênh đã cấu hình.',
        helpTip: 'Để biết thêm thông tin và mẹo, hãy sử dụng lệnh `/help` bất kỳ lúc nào.',
        footer: 'HoYo Code Sender - Nhận mã code game tự động!',
        dmInfo: 'Tôi không thể tìm thấy kênh phù hợp để gửi tin nhắn chào mừng trong máy chủ của bạn, vì vậy tôi đang gửi trực tiếp cho bạn.'
    },
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
            noReward: 'Chưa có thông tin phần thưởng',
            page: 'Trang'
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
            channelSetup: 'Kênh {channel} sẽ nhận thông báo code',
            autoSendSetup: 'Tính năng tự động gửi: {status}',
            noPermission: 'Bạn không có quyền sử dụng lệnh này',
            channelValidation: '✅ Kênh đã được xác thực thành công! Bot có thể gửi tin nhắn tại đây.',
            readyMessage: 'Máy chủ của bạn đã sẵn sàng nhận thông báo mã code!',
            rolesHeader: '🎭 Vai Trò Thông Báo',
            channelHeader: '📣 Kênh Thông Báo',
            autoSendHeader: '⚙️ Tính Năng Tự Động Gửi',
            error: {
                channelValidation: 'Xác thực kênh thất bại'
            }
        },
        deletesetup: {
            noPermission: 'Bạn không có quyền sử dụng lệnh này.',
            loading: 'Đang xóa cấu hình máy chủ...',
            success: 'Cấu hình máy chủ đã được xóa thành công.',
            noConfig: 'Không tìm thấy cấu hình nào cho máy chủ này.',
            error: 'Đã xảy ra lỗi khi xóa cấu hình máy chủ.',
            deletedItemsHeader: 'Các mục đã xóa:',
            deletedConfig: 'Cài đặt kênh và vai trò',
            deletedSettings: 'Cài đặt thông báo',
            deletedLanguage: 'Cài đặt ngôn ngữ'
        },
        postcode: {
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
            error: 'Không thể cập nhật cài đặt tự động gửi',
            noPermission: 'Bạn không có quyền sử dụng lệnh này'
        },
        favgames: {
            noPermission: 'Bạn không có quyền sử dụng lệnh này.',
            loading: 'Đang thiết lập game yêu thích...',
            success: 'Đã cấu hình game yêu thích thành công!',
            error: 'Đã xảy ra lỗi khi thiết lập game yêu thích.',
            filterStatus: 'Lọc game: **{status}**',
            gameStatusHeader: 'Thông Báo Game:',
            allGamesEnabled: 'Bạn sẽ nhận thông báo cho tất cả các game.'
        },
        help: {
            title: 'Trợ giúp HoYo Code Sender',
            description: 'HoYo Code Sender tự động thông báo cho máy chủ của bạn về các mã đổi thưởng mới cho Genshin Impact, Honkai: Star Rail và Zenless Zone Zero.',
            setupHeader: '📌 Cài đặt ban đầu',
            setupSteps: '1. Sử dụng `/setup` để cấu hình:\n' +
                       '   • Chọn kênh thông báo\n' +
                       '   • Đặt vai trò cho mỗi game (để nhắc đến khi có mã mới)\n' +
                       '   • Bật/tắt tự động gửi mã\n\n' +
                       '2. Tùy chỉnh trải nghiệm của bạn:\n' +
                       '   • `/favgames` - Chọn game bạn muốn nhận mã\n' +
                       '   • `/setlang` - Thay đổi ngôn ngữ của bot\n' +
                       '   • `/toggleautosend` - Bật/tắt thông báo mã tự động',
            commandsHeader: '📋 Các lệnh có sẵn',
            commandsList: '• `/setup` - Cài đặt bot ban đầu\n' +
                         '• `/favgames` - Chọn game bạn muốn nhận mã\n' +
                         '• `/toggleautosend` - Bật/tắt thông báo tự động\n' +
                         '• `/listcodes` - Hiển thị mã đang hoạt động cho một game\n' +
                         '• `/redeem` - Gửi mã cụ thể đến kênh của bạn\n' +
                         '• `/setlang` - Thay đổi ngôn ngữ bot (Tiếng Anh/Tiếng Việt/Tiếng Nhật)\n' +
                         '• `/help` - Hiển thị trợ giúp này\n' +
                         '• `/about` - Thông tin về bot',
            tipsHeader: '💡 Mẹo & thủ thuật',
            tipsList: '• Bot kiểm tra mã mới mỗi 5 phút\n' +
                     '• Bạn có thể đăng mã thủ công với `/redeem`\n' +
                     '• Sử dụng `/favgames` để lọc thông báo theo game\n' +
                     '• Đặt vai trò khác nhau cho từng loại game\n' +
                     '• Quản trị viên máy chủ có thể chạy `/setup` lại để thay đổi cài đặt',
            footer: 'HoYo Code Sender - Nhận mã game HoYoverse tự động!',
            error: 'Đã xảy ra lỗi khi hiển thị trợ giúp.'
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
            error: 'Lỗi kiểm tra trạng thái bình chọn. Vui lòng thử lại.',
            thankTitle: 'Cảm ơn bạn đã bình chọn! 🎉',
            thankMessage: 'Cảm ơn {user} đã ủng hộ bot bằng cách bình chọn trên Top.gg! Sự ủng hộ của bạn giúp chúng tôi phát triển.',
            voteAgain: 'Bạn có thể bình chọn lại sau 12 giờ.',
            dmThankTitle: 'Cảm ơn bạn đã bình chọn!',
            dmThankMessage: 'Cảm ơn bạn đã bình chọn cho HoYo Code Sender trên Top.gg! Sự ủng hộ của bạn rất có ý nghĩa với chúng tôi.'
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
        deletesetup: {
            noPermission: 'Bạn không có quyền sử dụng lệnh này.',
            loading: 'Đang xóa cấu hình máy chủ...',
            success: 'Cấu hình máy chủ đã được xóa thành công.',
            noConfig: 'Không tìm thấy cấu hình nào cho máy chủ này.',
            error: 'Đã xảy ra lỗi khi xóa cấu hình máy chủ.',
            deletedItems: 'Các mục đã xóa:',
            deletedConfig: 'Cài đặt kênh và vai trò',
            deletedSettings: 'Cài đặt thông báo',
            deletedLanguage: 'Cài đặt ngôn ngữ'
        },
        togglegame: {
            noPermission: 'Bạn không có quyền sử dụng lệnh này.',
            loading: 'Đang xử lý yêu cầu của bạn...',
            enabledWithNewRole: '✅ Thông báo **{game}** đã được bật với vai trò {role}.',
            enabledWithExistingRole: '✅ Thông báo **{game}** đã được bật với vai trò hiện có {role}.',
            enabledNoRole: '⚠️ Thông báo **{game}** đã được bật, nhưng không có vai trò nào được đặt. Thêm vai trò với `{command}` hoặc thông báo sẽ được gửi mà không đề cập đến bất kỳ ai.',
            disabled: '❌ Thông báo **{game}** đã bị tắt.',
            error: 'Đã xảy ra lỗi khi chuyển đổi thông báo trò chơi.'
        }
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
    common: {
        enabled: 'BẬT',
        disabled: 'TẮT'
    },
    games: {
        genshin: 'Genshin Impact',
        hkrpg: 'Honkai: Star Rail',
        nap: 'Zenless Zone Zero'
    }
};