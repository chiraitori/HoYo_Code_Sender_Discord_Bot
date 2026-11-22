module.exports = {
    games: {
        genshin: 'Genshin Impact',
        hkrpg: 'Honkai: Star Rail',
        nap: 'Zenless Zone Zero'
    },
    common: {
        enabled: 'BẬT',
        disabled: 'TẮT',
        notYourButton: 'Chỉ người dùng đã gọi lệnh mới có thể bấm nút này.',
        supportMsg: 'Hỗ trợ: github.com/sponsors/chiraitori | chiraitori.dev'
    },
    welcome: {
        title: 'Cảm ơn bạn đã thêm HoYo Code Sender',
        description: 'HoYo Code Sender tự động gửi giftcode mới của Genshin Impact, Honkai: Star Rail và Zenless Zone Zero vào máy chủ của bạn.',
        setupHeader: '🔧 Thiết lập nhanh',
        setupSteps:
            '1. Chạy `/setup` để chọn kênh thông báo và role ping cho từng game.\n' +
            '2. (Tùy chọn) Chạy `/favgames` để chọn những game bạn muốn nhận code.\n' +
            '3. (Tùy chọn) Chạy `/setlang` để đổi ngôn ngữ hiển thị (`en`, `jp`, `vi`).\n\n' +
            'Sau khi hoàn tất, bot sẽ tự động đăng code mới ngay khi phát hành.',
        helpTip: 'Gõ `/help` bất cứ lúc nào để xem toàn bộ danh sách lệnh.',
        footer: 'HoYo Code Sender',
        dmInfo: 'Bot không tìm thấy kênh văn bản nào có quyền gửi tin nhắn trong máy chủ, nên hướng dẫn thiết lập được gửi qua tin nhắn riêng.'
    },
    commands: {
        setlang: {
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.',
            success: 'Đã đổi ngôn ngữ của bot sang **{language}**.',
            error: 'Không thể cập nhật ngôn ngữ cho máy chủ.',
            description: 'Đổi ngôn ngữ hiển thị của bot trong máy chủ',
            languageOption: 'Chọn ngôn ngữ'
        },
        checkchannels: {
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.'
        },
        listcodes: {
            title: 'Code đang hoạt động — {game}',
            noCodes: 'Hiện không có code nào đang hoạt động cho {game}.',
            reward: 'Phần thưởng: {reward}',
            status: 'Trạng thái: {status}',
            redeemButton: 'Nhấn để nhận',
            redeemHeader: 'Đổi code tại đây',
            error: {
                fetch: 'Không thể tải danh sách code lúc này. Vui lòng thử lại sau.',
                invalid: 'Phản hồi từ API code không hợp lệ.',
                notFound: 'Hiện không có code nào.'
            },
            loading: 'Đang tải danh sách code...',
            newCodes: 'Mã code mới cho {game}!',
            noReward: 'Chưa rõ phần thưởng',
            page: 'Trang'
        },
        setup: {
            description: 'Thiết lập kênh thông báo và role ping cho từng game',
            genshinRole: 'Role nhận thông báo Genshin Impact',
            hsrRole: 'Role nhận thông báo Honkai: Star Rail',
            zzzRole: 'Role nhận thông báo Zenless Zone Zero',
            forumThreadHeader: '🧵 Chủ đề Forum (Thread)',
            forumThreadSuccess: '✅ Code cũng sẽ được đăng vào thread này.',
            forumThreadWarning: '⚠️ Thread đã chọn không hợp lệ hoặc bot thiếu quyền gửi tin nhắn nên đã được bỏ qua.',
            channel: 'Kênh nhận thông báo code',
            success: 'Đã lưu cấu hình máy chủ',
            roleSetup: 'Đã gán role {role} cho thông báo {type}',
            channelSetup: 'Kênh {channel} sẽ nhận thông báo code',
            autoSendSetup: 'Tự động gửi: {status}',
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.',
            channelValidation: '✅ Đã xác thực kênh. Bot có đủ quyền xem kênh, gửi tin nhắn và nhúng liên kết.',
            readyMessage: 'Máy chủ của bạn đã sẵn sàng nhận thông báo giftcode tự động.',
            rolesHeader: '🎭 Role thông báo',
            channelHeader: '📣 Kênh thông báo',
            autoSendHeader: '⚙️ Tự động gửi',
            demoTipHeader: '💡 Kiểm tra nhanh',
            demoTipText: 'Chạy `/demoautosend` để gửi thử một thông báo mẫu vào kênh vừa cài đặt.',
            error: {
                channelValidation: 'Xác thực kênh thất bại'
            }
        },
        deletesetup: {
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.',
            loading: 'Đang xóa cấu hình máy chủ...',
            success: 'Đã xóa toàn bộ cấu hình của máy chủ.',
            noConfig: 'Máy chủ này chưa có cấu hình nào được lưu.',
            error: 'Không thể xóa cấu hình máy chủ.',
            deletedItemsHeader: 'Các mục đã xóa:',
            deletedItems: 'Các mục đã xóa:',
            deletedConfig: 'Kênh thông báo, forum thread và role ping',
            deletedSettings: 'Cài đặt tự động gửi và bộ lọc game',
            deletedLanguage: 'Tùy chọn ngôn ngữ'
        },
        demoautosend: {
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.',
            noConfig: 'Máy chủ chưa cấu hình kênh thông báo. Vui lòng chạy `/setup` trước.',
            channelError: 'Không thể gửi tin nhắn vào kênh đã cấu hình:',
            title: '🔔 Thông báo thử nghiệm — {game}',
            notice: '⚠️ Mã thử nghiệm',
            noticeText: 'Đây là mã mẫu dùng để kiểm tra kênh và role thông báo, không thể nhập trong game.',
            success: 'Đã gửi thông báo thử nghiệm cho {count} game.',
            error: 'Không thể gửi thông báo thử nghiệm.'
        },
        postcode: {
            modalTitle: 'Đăng giftcode thủ công',
            inputLabels: {
                games: 'Game (genshin / hsr / zzz)',
                code1: 'Code 1 (Bắt buộc)',
                code2: 'Code 2 (Tùy chọn)',
                code3: 'Code 3 (Tùy chọn)',
                message: 'Ghi chú thêm (Tùy chọn)'
            },
            description: 'Đăng giftcode thủ công vào kênh thông báo của máy chủ',
            success: 'Đã đăng code vào kênh thông báo.',
            error: 'Không thể đăng code.',
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.',
            embedTitle: 'Giftcode {game} mới',
            embedDescription: 'Giftcode mới cho {game} vừa được đăng.',
            messageLabel: 'Ghi chú',
            redeemButton: 'Nhấn để nhận',
            postcodeButton: 'Nhấn để nhận',
            invalidGame: 'Game không hợp lệ. Vui lòng nhập `genshin`, `hsr` hoặc `zzz`.',
            noCode: 'Vui lòng nhập ít nhất một mã code.'
        },
        toggleautosend: {
            loading: 'Đang cập nhật chế độ tự động gửi...',
            success: 'Tự động gửi code hiện đang: **{status}**.',
            error: 'Không thể cập nhật chế độ tự động gửi.',
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.'
        },
        autosendoptions: {
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.',
            success: '✅ Đã cập nhật nơi nhận code tự động.',
            warning: {
                autoSendDisabled: '⚠️ Tự động gửi hiện đang **tắt**. Hãy bật trước bằng lệnh `/toggleautosend status:Enable`.'
            },
            error: {
                bothDisabled: '⚠️ Không thể tắt đồng thời cả kênh chính và forum thread. Vui lòng bật ít nhất một nơi nhận.',
                general: 'Không thể cập nhật tùy chọn nơi nhận code.'
            }
        },
        favgames: {
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.',
            loading: 'Đang cập nhật bộ lọc game...',
            success: 'Đã lưu danh sách game nhận thông báo.',
            error: 'Không thể cập nhật bộ lọc game.',
            filterStatus: 'Lọc theo game: **{status}**',
            gameStatusHeader: 'Trạng thái từng game:',
            allGamesEnabled: 'Nhận thông báo cho tất cả các game.'
        },
        help: {
            title: 'Hướng dẫn HoYo Code Sender',
            description: 'Tự động gửi giftcode mới của Genshin Impact, Honkai: Star Rail và Zenless Zone Zero tới máy chủ Discord của bạn.',
            setupHeader: '📌 Thiết lập cơ bản',
            setupSteps:
                '1. Chạy `/setup` để chọn kênh thông báo chính, role ping từng game và bật tự động gửi.\n' +
                '2. Tùy chỉnh thêm khi cần:\n' +
                '   • `/livestreamcodesetup` — Đặt kênh riêng cho code livestream Special Program\n' +
                '   • `/setupthread` — Đăng code của từng game vào forum thread riêng\n' +
                '   • `/favgames` — Chọn những game muốn nhận thông báo\n' +
                '   • `/setlang` — Đổi ngôn ngữ (`English`, `Japanese`, `Vietnamese`)',
            commandsHeader: '📋 Danh sách lệnh',
            commandsList:
                '• `/setup` — Thiết lập kênh thông báo, role và tự động gửi\n' +
                '• `/livestreamcodesetup` — Cấu hình kênh riêng và thông báo lịch livestream\n' +
                '• `/setupthread` — Gán forum thread riêng cho từng game\n' +
                '• `/autosendoptions` — Chọn gửi vào kênh chính, forum thread hoặc cả hai\n' +
                '• `/favgames` — Lọc những game muốn nhận code\n' +
                '• `/toggleautosend` — Bật hoặc tắt tự động gửi code\n' +
                '• `/listcodes` — Xem danh sách code đang còn hạn\n' +
                '• `/postcode` — Đăng 1–3 code thủ công vào kênh\n' +
                '• `/checkchannels` — Kiểm tra quyền của bot trong kênh đã cài\n' +
                '• `/demoautosend` — Gửi thông báo mẫu để kiểm tra cài đặt\n' +
                '• `/setlang` — Đổi ngôn ngữ hiển thị (`en`, `jp`, `vi`)\n' +
                '• `/deletesetup` — Xóa toàn bộ cấu hình máy chủ\n' +
                '• `/dashboard` — Mở bảng điều khiển web\n' +
                '• `/vote` — Kiểm tra trạng thái bình chọn trên Top.gg\n' +
                '• `/about` — Xem phiên bản bot và các liên kết hỗ trợ\n' +
                '• `/help` — Hiển thị bảng hướng dẫn này',
            tipsHeader: '💡 Lưu ý',
            tipsList:
                '• Bot tự động kiểm tra code mới mỗi 5 phút và theo dõi suốt thời gian livestream Special Program.\n' +
                '• Liên kết đổi thưởng điền sẵn mã code trên trang HoYoLAB chính thức.\n' +
                '• Nếu bot không gửi được tin, hãy dùng `/checkchannels` để kiểm tra quyền.',
            footer: 'HoYo Code Sender',
            error: 'Không thể tải nội dung hướng dẫn.'
        },
        vote: {
            title: 'Bình chọn cho HoYo Code Sender',
            description: 'Ủng hộ HoYo Code Sender bằng cách bình chọn trên Top.gg.',
            status: 'Trạng thái bình chọn',
            hasVoted: '✅ Bạn đã bình chọn trong 12 giờ qua. Cảm ơn bạn đã ủng hộ!',
            hasNotVoted: '❌ Bạn chưa bình chọn trong 12 giờ qua.',
            link: 'Bình chọn trên Top.gg',
            error: 'Không thể kiểm tra trạng thái bình chọn.',
            thankTitle: 'Cảm ơn bạn đã bình chọn! 🎉',
            thankMessage: 'Cảm ơn {user} đã bình chọn cho HoYo Code Sender trên Top.gg!',
            voteAgain: 'Bạn có thể bình chọn lại sau mỗi 12 giờ.',
            dmThankTitle: 'Cảm ơn bạn đã bình chọn!',
            dmThankMessage: 'Cảm ơn bạn đã bình chọn cho HoYo Code Sender trên Top.gg!'
        },
        about: {
            title: 'Giới thiệu HoYo Code Sender',
            description: 'Bot Discord tự động gửi giftcode mới của Genshin Impact, Honkai: Star Rail và Zenless Zone Zero từ HoYoverse.',
            version: 'Phiên bản',
            sourceCode: 'Mã nguồn',
            inviteLink: 'Liên kết mời bot',
            supportServer: 'Máy chủ hỗ trợ',
            vote: 'Bình chọn trên Top.gg',
            github: 'Kho mã nguồn GitHub',
            devbio: 'Trang nhà phát triển',
            donate: 'Ủng hộ',
            sponsor: 'GitHub Sponsors',
            error: 'Không thể tải thông tin giới thiệu.'
        },
        dashboard: {
            title: '🌐 Bảng điều khiển Web',
            description: 'Quản lý kênh thông báo, forum thread, role ping, bộ lọc game và đăng code trực tiếp trên trình duyệt.',
            webInterface: 'Địa chỉ truy cập',
            openDashboard: 'Mở bảng điều khiển',
            features: 'Tính năng hỗ trợ',
            featuresList:
                '• 📣 Chọn kênh thông báo chính và kênh livestream riêng\n' +
                '• 🧵 Gán forum thread riêng cho từng game\n' +
                '• 🎭 Chọn role ping theo từng game\n' +
                '• 🎮 Bật/tắt game nhận code và đổi ngôn ngữ\n' +
                '• 📝 Đăng code thủ công và kiểm tra quyền kênh trực tiếp',
            requirements: 'Yêu cầu',
            requirementsList:
                '• Đăng nhập bằng tài khoản Discord\n' +
                '• Có quyền Chủ sở hữu, Quản trị viên hoặc Quản lý Máy chủ / Quản lý Kênh\n' +
                '• Máy chủ đã cài đặt HoYo Code Sender',
            footer: 'HoYo Code Sender Dashboard',
            error: 'Không thể tải thông tin bảng điều khiển.'
        },
        togglegame: {
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.',
            loading: 'Đang cập nhật cài đặt thông báo game...',
            enabledWithNewRole: '✅ Đã bật thông báo **{game}** với role {role}.',
            enabledWithExistingRole: '✅ Đã bật thông báo **{game}** với role {role}.',
            enabledNoRole: '⚠️ Đã bật thông báo **{game}** nhưng chưa gán role ping. Dùng `{command}` để thêm role.',
            disabled: '❌ Đã tắt thông báo **{game}**.',
            error: 'Không thể cập nhật thông báo game.'
        },
        sendtothread: {
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.',
            noActiveCodes: 'Hiện không có code nào đang hoạt động cho {game}.',
            success: '✅ Đã gửi {count} code {game} đang hoạt động vào thread "{thread}".',
            instructions: '**Cách nhập code:**\n1. Mở liên kết đổi thưởng bên trên\n2. Đăng nhập tài khoản HoYoverse\n3. Xác nhận mã code và nhận thưởng trong hộp thư in-game',
            error: {
                notThread: 'Kênh đã chọn không phải là forum thread.',
                noPermission: 'Bot không có quyền gửi tin nhắn trong thread này.',
                general: 'Không thể gửi code vào thread.'
            }
        },
        setupthread: {
            noPermission: 'Bạn cần quyền Quản trị viên (Administrator) để dùng lệnh này.',
            success: '✅ Đã lưu cấu hình forum thread. Code mới sẽ được đăng vào thread riêng của từng game.',
            error: {
                notThread: 'Một hoặc nhiều kênh đã chọn không phải là forum thread.',
                noPermission: 'Bot thiếu quyền gửi tin nhắn hoặc nhúng liên kết trong một hoặc nhiều thread đã chọn.',
                noSetup: 'Vui lòng chạy `/setup` trước để thiết lập kênh thông báo chính.',
                general: 'Không thể lưu cấu hình forum thread.'
            }
        },
        livestreamcodesetup: {
            setupRequiredTitle: '⚠️ Cần thiết lập kênh chính trước',
            setupRequired: 'Vui lòng chạy `/setup` để chọn kênh thông báo chính trước khi cài đặt kênh livestream.',
            title: '📺 Cấu hình kênh code livestream',
            currentSetting: 'Kênh hiện tại',
            usingMainChannel: 'Đang dùng chung kênh chính: {channel}',
            notConfigured: 'Chưa thiết lập',
            behavior: 'Cách gửi',
            dedicatedBehavior: '✅ Code livestream được gửi vào kênh riêng.',
            mainBehavior: 'ℹ️ Code livestream được gửi vào kênh thông báo chính.',
            announcementStatus: 'Thông báo lịch Special Program',
            announcementEnabled: '✅ Đang bật thông báo lịch livestream Special Program.',
            announcementDisabled: '❌ Đang tắt thông báo lịch livestream Special Program.',
            removedTitle: '✅ Đã gỡ kênh livestream riêng',
            removedDescription: 'Code livestream từ giờ sẽ được gửi vào kênh thông báo chính.',
            mainChannel: 'Kênh chính',
            channelRequiredTitle: '❌ Chưa chọn kênh',
            channelRequired: 'Vui lòng chọn một kênh khi dùng tùy chọn **Set Channel**.',
            insufficientPermissionsTitle: '⚠️ Thiếu quyền trong kênh',
            insufficientPermissions: 'Bot chưa được cấp đủ quyền cần thiết trong {channel}.',
            requiredPermissions: 'Quyền cần thiết',
            requiredPermissionsValue: '• Xem kênh (View Channel)\n• Gửi tin nhắn (Send Messages)\n• Nhúng liên kết (Embed Links)',
            configuredTitle: '✅ Đã lưu kênh livestream',
            configuredDescription: 'Code livestream Special Program sẽ được gửi vào kênh riêng này.',
            livestreamCodes: '📺 Code livestream',
            regularCodes: '📋 Code thường',
            whatHappensNow: '💡 Tóm tắt luồng gửi',
            whatHappensNowValue:
                '• Code thường → Kênh chính (hoặc forum thread của từng game)\n' +
                '• Code livestream → Kênh livestream riêng\n' +
                '• Thông báo lịch Special Program → Kênh livestream riêng',
            announcementEnabledTitle: '✅ Đã bật thông báo lịch livestream',
            announcementEnabledDescription: 'Bot sẽ tự động thông báo trước khi buổi livestream Special Program diễn ra.',
            announcementDisabledTitle: '❌ Đã tắt thông báo lịch livestream',
            announcementDisabledDescription: 'Đã tắt thông báo lịch phát sóng. Code livestream vẫn sẽ được gửi tự động khi phát hành.',
            errorTitle: '❌ Lỗi',
            errorDescription: 'Không thể lưu cấu hình kênh livestream.',
            errorFooter: 'Vui lòng kiểm tra lại quyền của bot và thử lại.'
        }
    },
    livestream: {
        codes: {
            title: 'Code livestream {game}',
            description: 'Phiên bản {version} — {count} mã code',
            code: 'Code {number}',
            expires: 'Hạn dùng',
            unknownExpiry: 'Chưa rõ',
            redeemHere: 'Đổi code tại đây',
            redeem: 'Nhấn để nhận'
        },
        announcement: {
            content: '📢 **Thông báo livestream {game}**',
            title: '📺 Đã có lịch livestream {game} Special Program',
            description: 'Buổi livestream giới thiệu **Phiên bản {version}** đã có lịch phát sóng.',
            streamTime: '📅 Thời gian phát sóng',
            estimatedStreamTime: '📅 Thời gian dự kiến',
            whatToExpect: '🎁 Nội dung chính',
            whatToExpectValue: '• Giới thiệu nội dung phiên bản mới\n• Phát giftcode giới hạn trong buổi stream\n• Hé lộ nhân vật, vũ khí và sự kiện mới',
            watchOnYoutube: '▶️ Xem trên YouTube',
            status: {
                live: 'ĐANG TRỰC TIẾP',
                upcoming: 'Sắp diễn ra',
                officialChannel: 'Kênh chính thức'
            }
        }
    },
    errors: {
        general: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        api: 'Không thể kết nối tới API bên ngoài.',
        database: 'Đã xảy ra lỗi cơ sở dữ liệu.',
        invalidChannel: 'Không tìm thấy kênh thông báo đã cấu hình.',
        noConfig: 'Máy chủ này chưa cấu hình kênh thông báo. Vui lòng chạy `/setup` trước.',
        rateLimit: 'Thao tác quá nhanh. Vui lòng đợi ít phút rồi thử lại.',
        dmNotAllowed:
            '❌ Lệnh `/{command}` chỉ dùng được trong máy chủ Discord, không dùng được trong tin nhắn riêng.\n\n' +
            'Vui lòng chạy lệnh này trong máy chủ đã cài đặt HoYo Code Sender.'
    },
    system: {
        startup: 'Bot đang khởi động...',
        ready: 'Bot đã trực tuyến.',
        checking: 'Đang kiểm tra code mới...',
        connected: 'Đã kết nối cơ sở dữ liệu.',
        disconnected: 'Đã ngắt kết nối cơ sở dữ liệu.'
    }
};
