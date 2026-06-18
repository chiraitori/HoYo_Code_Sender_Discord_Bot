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
        notYourButton: 'Nút này không dành cho bạn.',
        supportMsg: '❤️ Hỗ trợ nhà phát triển: ko-fi.com/chiraitori | github.com/sponsors/chiraitori | paypal.me/chiraitori | chiraitori.me'
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
            forumThreadHeader: '🧵 Thread Diễn Đàn',
            forumThreadSuccess: '✅ Code cũng sẽ được đăng lên thread này!',
            forumThreadWarning: '⚠️ Thread diễn đàn đã được cung cấp nhưng bot không có quyền hoặc không phải là thread hợp lệ. Nó sẽ không được sử dụng.',
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
            demoTipHeader: '💡 Mẹo kiểm tra',
            demoTipText: 'Bạn có thể kiểm tra cài đặt của mình ngay bằng cách sử dụng lệnh `/demoautosend` để gửi tin nhắn thông báo demo.',
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
        demoautosend: {
            noPermission: 'Bạn cần quyền quản trị viên để sử dụng lệnh này.',
            noConfig: 'Bot chưa được thiết lập! Vui lòng sử dụng lệnh `/setup` trước để cấu hình kênh.',
            channelError: 'Không thể gửi tin nhắn đến kênh đã cấu hình:',
            title: '🔔 Mã code demo cho {game}!',
            notice: '⚠️ Thông báo demo',
            noticeText: 'Đây là mã code demo chỉ dùng để kiểm tra. Chúng sẽ không hoạt động trong game.',
            success: 'Đã gửi thành công mã code demo cho {count} game!',
            error: 'Đã xảy ra lỗi khi gửi mã code demo.'
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
            redeemButton: 'Nhấn để nhận',
            invalidGame: 'Game không hợp lệ. Vui lòng sử dụng: genshin, hsr, hoặc zzz',
            noCode: 'Cần ít nhất một mã code.'
        },
        toggleautosend: {
            loading: 'Đang cập nhật cài đặt tự động gửi...',
            success: 'Tự động gửi hiện đang: **{status}**',
            error: 'Không thể cập nhật cài đặt tự động gửi',
            noPermission: 'Bạn không có quyền sử dụng lệnh này'
        },
        autosendoptions: {
            noPermission: 'Bạn cần quyền Quản trị viên để sử dụng lệnh này.',
            success: '✅ Tùy chọn tự động gửi đã được cập nhật thành công!',
            warning: {
                autoSendDisabled: '⚠️ Tự động gửi hiện đang **tắt**. Hãy bật nó trước với `/toggleautosend status:Enable`'
            },
            error: {
                bothDisabled: '⚠️ Bạn không thể tắt cả kênh và thread. Ít nhất một trong hai phải được bật.',
                general: 'Đã xảy ra lỗi khi cập nhật tùy chọn tự động gửi.'
            }
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
                '• `/deletesetup` - Xóa cấu hình máy chủ\n' +
                '• `/favgames` - Chọn game bạn muốn nhận mã\n' +
                '• `/toggleautosend` - Bật/tắt thông báo tự động\n' +
                '• `/autosendoptions` - Cấu hình tùy chọn tự động gửi\n' +
                '• `/listcodes` - Hiển thị mã đang hoạt động cho một game\n' +
                '• `/postcode` - Gửi mã cụ thể đến kênh của bạn\n' +
                '• `/demoautosend` - Gửi mã code demo để kiểm tra thông báo\n' +
                '• `/setupthread` - Thiết lập thread diễn đàn cho thông báo mã\n' +
                '• `/checkchannels` - Kiểm tra các kênh thông báo đã cấu hình\n' +
                '• `/livestreamcodesetup` - Cấu hình kênh mã livestream\n' +
                '• `/setlang` - Thay đổi ngôn ngữ bot (Tiếng Anh/Tiếng Việt/Tiếng Nhật)\n' +
                '• `/dashboard` - Mở bảng điều khiển web\n' +
                '• `/vote` - Bình chọn cho bot trên Top.gg\n' +
                '• `/help` - Hiển thị trợ giúp này\n' +
                '• `/about` - Thông tin về bot',
            tipsHeader: '💡 Mẹo & thủ thuật',
            tipsList: '• Bot kiểm tra mã mới mỗi 5 phút\n' +
                '• Bạn có thể đăng mã thủ công với `/postcode`\n' +
                '• Sau khi thiết lập, sử dụng `/demoautosend` để kiểm tra hệ thống thông báo\n' +
                '• Sử dụng `/favgames` để lọc thông báo theo game\n' +
                '• Đặt vai trò khác nhau cho từng loại game\n' +
                '• Sử dụng `/livestreamcodesetup` để đặt kênh riêng cho mã livestream\n' +
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
            donate: 'Ủng hộ tôi nếu trong nước thì có thể donate qua tiểu sử',
            sponsor: 'GitHub Sponsors'
        },
        dashboard: {
            title: '🌐 Bảng Điều Khiển Web',
            description: 'Truy cập bảng điều khiển web HoYo Code Sender để quản lý cài đặt máy chủ với giao diện thân thiện.',
            webInterface: 'Giao Diện Web',
            openDashboard: 'Mở Bảng Điều Khiển',
            features: 'Tính Năng Bảng Điều Khiển',
            featuresList: '• 📊 Thống kê máy chủ trực tiếp\n• ⚙️ Quản lý cấu hình trực quan\n• 🎮 Gán vai trò game\n• 📱 Giao diện thân thiện với mobile\n• 🔔 Kiểm tra thông báo\n• 🔄 Cập nhật thời gian thực',
            requirements: 'Yêu Cầu',
            requirementsList: '• Đăng nhập tài khoản Discord\n• Quyền quản trị viên máy chủ\n• Bot phải có trong máy chủ của bạn',
            footer: 'Quản lý cài đặt bot dễ dàng với bảng điều khiển web!',
            error: 'Lỗi khi tải thông tin bảng điều khiển.'
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
        },
        sendtothread: {
            noPermission: 'Bạn cần quyền Quản trị viên để sử dụng lệnh này.',
            noActiveCodes: 'Không tìm thấy code đang hoạt động cho {game}.',
            success: '✅ Đã gửi thành công {count} code đang hoạt động cho {game} tới thread "{thread}"!',
            instructions: '**Cách đổi code:**\n1. Nhấp vào liên kết bên trên\n2. Đăng nhập vào tài khoản của bạn\n3. Nhập code\n4. Nhận phần thưởng trong game!',
            error: {
                notThread: 'Kênh đã chọn không phải là thread. Vui lòng chọn một forum thread.',
                noPermission: 'Tôi không có quyền gửi tin nhắn trong thread đó. Vui lòng kiểm tra quyền.',
                general: 'Đã xảy ra lỗi khi gửi code đến thread.'
            }
        },
        setupthread: {
            noPermission: 'Bạn cần quyền Quản trị viên để sử dụng lệnh này.',
            success: '✅ Các thread forum đã được cấu hình! Code sẽ được đăng vào thread cố định dành riêng cho từng game.',
            error: {
                notThread: 'Một trong các kênh đã chọn không phải là thread forum. Vui lòng chọn các thread forum.',
                noPermission: 'Tôi không có quyền gửi tin nhắn trong một trong các thread. Vui lòng kiểm tra quyền của tôi.',
                noSetup: 'Vui lòng chạy `/setup` trước để cấu hình kênh thông báo chính.',
                general: 'Đã xảy ra lỗi khi thiết lập các thread forum.'
            }
        },
        livestreamcodesetup: {
            setupRequiredTitle: '⚠️ Cần thiết lập trước',
            setupRequired: 'Vui lòng chạy `/setup` trước để cấu hình máy chủ trước khi thiết lập kênh livestream.',
            title: '📺 Cấu hình kênh code livestream',
            currentSetting: 'Cài đặt hiện tại',
            usingMainChannel: 'Đang dùng kênh chính: {channel}',
            notConfigured: 'Chưa cấu hình',
            behavior: 'Cách hoạt động',
            dedicatedBehavior: '✅ Code livestream sẽ được gửi vào kênh riêng',
            mainBehavior: 'ℹ️ Code livestream sẽ được gửi cùng kênh với code thường',
            announcementStatus: 'Announcement',
            announcementEnabled: '✅ Thông báo Special Program đang bật',
            announcementDisabled: '❌ Thông báo Special Program đang tắt',
            removedTitle: '✅ Đã gỡ kênh livestream',
            removedDescription: 'Code livestream giờ sẽ được gửi vào kênh chính cùng code thường.',
            mainChannel: 'Kênh chính',
            channelRequiredTitle: '❌ Cần chọn kênh',
            channelRequired: 'Vui lòng chọn kênh khi dùng hành động "Set Channel".',
            insufficientPermissionsTitle: '⚠️ Thiếu quyền',
            insufficientPermissions: 'Bot không có đủ quyền cần thiết trong {channel}',
            requiredPermissions: 'Quyền cần thiết',
            requiredPermissionsValue: '• Xem kênh\n• Gửi tin nhắn\n• Nhúng liên kết',
            configuredTitle: '✅ Đã cấu hình kênh livestream',
            configuredDescription: 'Code livestream sẽ được gửi vào kênh riêng!',
            livestreamCodes: '📺 Code livestream',
            regularCodes: '📋 Code thường',
            whatHappensNow: '💡 Sau đó thì sao?',
            whatHappensNowValue: '• Code thường -> Kênh chính\n• Code livestream từ Special Program -> Kênh riêng\n• Thông báo Special Program cũng dùng cài đặt này',
            announcementEnabledTitle: '✅ Đã bật livestream announcement',
            announcementEnabledDescription: 'Thông báo Special Program sẽ được gửi trước các livestream sắp diễn ra.',
            announcementDisabledTitle: '❌ Đã tắt livestream announcement',
            announcementDisabledDescription: 'Thông báo Special Program đã tắt. Code livestream vẫn có thể được gửi khi có code.',
            errorTitle: '❌ Lỗi',
            errorDescription: 'Đã xảy ra lỗi khi cấu hình kênh livestream.',
            errorFooter: 'Vui lòng thử lại hoặc liên hệ hỗ trợ nếu lỗi vẫn tiếp diễn.'
        }
    },
    livestream: {
        announcement: {
            content: '📢 **Thông báo livestream {game}**',
            title: '📺 {game} đã công bố Special Program!',
            description: 'Livestream **Phiên bản {version}** đã được lên lịch!',
            streamTime: '📅 Thời gian stream',
            estimatedStreamTime: '📅 Thời gian stream dự kiến',
            whatToExpect: '🎁 Nội dung dự kiến',
            whatToExpectValue: '• Xem trước phiên bản mới\n• Code đổi thưởng (sẽ có 3 code)\n• Hé lộ nhân vật/vũ khí',
            watchOnYoutube: '▶️ Xem trên YouTube',
            status: {
                live: 'ĐANG LIVE',
                upcoming: 'Sắp diễn ra',
                officialChannel: 'Kênh chính thức'
            }
        }
    },
    errors: {
        general: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        api: 'Lỗi kết nối tới API',
        database: 'Đã xảy ra lỗi cơ sở dữ liệu',
        invalidChannel: 'Lỗi: Không tìm thấy kênh đã cấu hình',
        noConfig: 'Lỗi: Kênh chưa được cấu hình cho máy chủ này',
        rateLimit: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        dmNotAllowed: '❌ Lệnh `/{command}` chỉ có thể được sử dụng trong máy chủ Discord, không phải trong tin nhắn riêng.\n\n' +
            'Vui lòng sử dụng lệnh này trong máy chủ có cài đặt bot HoYo Code Sender.'
    },
    system: {
        startup: 'Bot đang khởi động...',
        ready: 'Bot đã sẵn sàng!',
        checking: 'Đang kiểm tra code mới...',
        connected: 'Đã kết nối tới cơ sở dữ liệu',
        disconnected: 'Đã ngắt kết nối khỏi cơ sở dữ liệu'
    }
};
