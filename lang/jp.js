const { version } = require("mongoose");
const about = require("../commands/about");

module.exports = {
    games: {
        genshin: '<:genshin:1368073403231375430> 原神',
        hkrpg: '<:hsr:1368073099756703794> 崩壊：スターレイル',
        nap: '<:zzz:1368073452174704763> ゼンレス・ゾーン・ゼロ'
    },
    common: {
        enabled: '有効',
        disabled: '無効',
        notYourButton: 'このボタンはあなたのものではありません。',
        supportMsg: '❤️ 開発者を応援: ko-fi.com/chiraitori | github.com/sponsors/chiraitori | paypal.me/chiraitori'
    },
    welcome: {
        title: 'HoYo Code Senderを追加していただきありがとうございます！',
        description: 'サーバーに追加していただきありがとうございます！HoYoverseゲームのコードを自動的に取得するお手伝いをします。',
        setupHeader: '🔧 クイックセットアップガイド',
        setupSteps: '1. `/setup`を実行して通知チャンネルとロールを設定\n' +
                   '2. (オプション) `/favgames`でコードを受け取りたいゲームを選択\n' +
                   '3. (オプション) `/setlang`で言語を変更\n\n' +
                   'これだけです！新しいゲームコードが設定したチャンネルに自動的に送信されます。',
        helpTip: '詳細情報やヒントについては、いつでも`/help`を実行してください。',
        footer: 'HoYo Code Sender - ゲームコードを自動的に入手！',
        dmInfo: 'サーバー内に適切なチャンネルが見つからなかったため、直接メッセージを送信しています。'
    },
    commands: {
        setlang: {
            success: 'サーバー言語が**{language}**に設定されました',
            error: 'サーバー言語の設定に失敗しました',
            description: 'サーバーのBot言語を設定する',
            languageOption: '言語を選択'
        },
        listcodes: {
            title: '{game}のアクティブコード',
            noCodes: '{game}のアクティブコードが見つかりません',
            reward: '報酬: {reward}',
            status: 'ステータス: {status}',
            redeemButton: '受け取る',
            redeemHeader: '受け取り方法',
            newCodes: '新しい{game}コード！',
            noReward: '報酬未指定',
            error: {
                fetch: 'コードの取得中にエラーが発生しました。後でもう一度お試しください。',
                invalid: 'APIからの無効な応答',
                notFound: '利用可能なコードがありません'
            },
            loading: 'コードを読み込んでいます...',
            page: 'ページ'
        },        
        setup: {
            description: 'コード通知用のロールとチャンネルを設定',
            genshinRole: '原神の通知用ロール',
            hsrRole: 'スターレイルの通知用ロール',
            zzzRole: 'ゼンレスゾーンゼロの通知用ロール',
            channel: 'コード通知用チャンネル',
            success: 'サーバー設定が完了しました！',
            error: 'セットアップに失敗しました',
            roleSetup: '{type}通知のロール{role}が設定されました',
            channelSetup: 'コード通知は{channel}に送信されます',
            autoSendSetup: '自動送信機能: {status}',
            noPermission: 'このコマンドを使用する権限がありません',
            channelValidation: '✅ チャンネルが正常に検証されました！ボットはここでメッセージを送信できます。',
            readyMessage: 'サーバーがコード通知を受信する準備ができました！',
            rolesHeader: '🎭 通知ロール',
            channelHeader: '📣 通知チャンネル',
            autoSendHeader: '⚙️ 自動送信機能',
            demoTipHeader: '💡 テストのヒント',
            demoTipText: '`/demoautosend`コマンドを使用して、すぐにデモ通知メッセージを送信し、設定をテストできます。',
            error: {
                channelValidation: 'チャンネル検証に失敗しました'
            }
        },
        deletesetup: {
            noPermission: 'このコマンドを使用する権限がありません。',
            loading: 'サーバー設定を削除しています...',
            success: 'サーバー設定が正常に削除されました。',
            noConfig: 'このサーバーの設定が見つかりませんでした。',
            error: 'サーバー設定の削除中にエラーが発生しました。',
            deletedItemsHeader: '削除されたアイテム:',
            deletedConfig: 'チャンネルとロール設定',
            deletedSettings: '通知設定',
            deletedLanguage: '言語設定'
        },
        demoautosend: {
            noPermission: 'このコマンドを使用するには管理者権限が必要です。',
            noConfig: 'Botがまだ設定されていません！チャンネルを設定するには、まず`/setup`を使用してください。',
            channelError: '設定されたチャンネルにメッセージを送信できません:',
            title: '🔔 {game}のデモコード！',
            notice: '⚠️ デモ通知',
            noticeText: 'これらはテスト目的のデモコードです。ゲーム内では機能しません。',
            success: '{count}個のゲームにデモコードを正常に送信しました！',
            error: 'デモコードの送信中にエラーが発生しました。'
        },
        postcode: {
            modalTitle: '引換コードを追加',
            inputLabels: {
                games: 'ゲームを選択（genshin/hsr/zzz）',
                code1: 'コード1（必須）',
                code2: 'コード2（任意）',
                code3: 'コード3（任意）',
                message: '追加メッセージ（任意）'
            },
            description: '引き換えコードと説明を表示',
            success: 'コードが正常に投稿されました！',
            error: 'コマンドの処理中にエラーが発生しました',
            noPermission: 'このコマンドを使用する権限がありません',
            embedTitle: '新しいコードが引き換えられました',
            embedDescription: '{game}の新しいコードが引き換えられました！',
            messageLabel: 'メッセージ:',
            redeemButton: 'クリックして引き換える',
            invalidGame: '無効なゲーム。genshin、hsr、zzzのいずれかを使用してください',
            noCode: '少なくとも1つのコードが必要です。'
        },
        toggleautosend: {
            loading: '自動送信設定を更新中...',
            success: '自動送信が「{status}」に設定されました',
            error: '自動送信設定の更新に失敗しました',
            noPermission: 'このコマンドを使用する権限がありません'
        },
        favgames: {
            noPermission: 'このコマンドを使用する権限がありません',
            loading: 'お気に入りゲームを設定中...',
            success: 'お気に入りゲームの設定が完了しました！',
            error: 'お気に入りゲームの設定中にエラーが発生しました。',
            filterStatus: 'ゲームフィルター: **{status}**',
            gameStatusHeader: 'ゲーム通知:',
            allGamesEnabled: 'すべてのゲームの通知を受け取ります。'
        },
        help: {
            title: 'HoYo Code Senderヘルプ',
            description: 'HoYo Code Senderは、原神、崩壊：スターレイル、ゼンレス・ゾーン・ゼロの新しい引換コードについて自動的に通知します。',
            setupHeader: '📌 初期設定',
            setupSteps: '1. `/setup`を実行して設定：\n' +
                       '   • 通知チャンネルを選択\n' +
                       '   • 各ゲーム用のロールを設定（コード到着時にメンションするため）\n' +
                       '   • 自動コード送信の有効/無効を設定\n\n' +
                       '2. カスタマイズ：\n' +
                       '   • `/favgames` - コードを受け取るゲームを選択\n' +
                       '   • `/setlang` - Botの言語を変更\n' +
                       '   • `/toggleautosend` - 自動通知のオン/オフを切り替え',
            commandsHeader: '📋 利用可能なコマンド',            
            commandsList: '• `/setup` - 初期Bot設定\n' +
                         '• `/favgames` - コードを受け取るゲームを選択\n' +
                         '• `/toggleautosend` - 自動通知のオン/オフを切り替え\n' +
                         '• `/listcodes` - ゲームのアクティブコードを表示\n' +
                         '• `/redeem` - 特定のコードをチャンネルに送信\n' +
                         '• `/demoautosend` - テスト用のデモコード通知を送信\n' +
                         '• `/setlang` - Botの言語を変更（英語/ベトナム語/日本語）\n' +
                         '• `/help` - このヘルプメッセージを表示\n' +
                         '• `/about` - Botについての情報',
            tipsHeader: '💡 ヒントとコツ',            
            tipsList: '• Botは5分ごとに新しいコードをチェックします\n' +
                     '• `/redeem`で手動でコードを投稿できます\n' +
                     '• セットアップ後、`/demoautosend`を使用して通知システムをテストできます\n' +
                     '• `/favgames`でゲームごとに通知をフィルタリングできます\n' +
                     '• ゲームタイプごとに異なるロールを設定できます\n' +
                     '• サーバー管理者は`/setup`を再度実行して設定を変更できます',
            footer: 'HoYo Code Sender - HoYoverseゲームコードを自動的に入手！',
            error: 'ヘルプの表示中にエラーが発生しました。'
        },
        vote: {
            title: 'HoYo Code Senderに投票',
            description: 'Top.ggで投票して私たちをサポートしてください！あなたの投票が成長とより多くのユーザーへの到達を助けます。',
            status: '投票状況',
            hasVoted: '✅ 投票ありがとうございます！12時間後に再度投票できます。',
            hasNotVoted: '❌ まだ今日は投票していません！',
            link: '投票はこちら',
            error: '投票状況の確認中にエラーが発生しました。もう一度お試しください。',
            thankTitle: '投票ありがとうございます！🎉',
            thankMessage: '{user} さん、Top.ggでボットに投票していただきありがとうございます！あなたのサポートが私たちの成長を助けます。',
            voteAgain: '12時間後に再度投票できます。',
            dmThankTitle: '投票ありがとうございます！',
            dmThankMessage: 'Top.ggでHoYo Code Senderに投票していただき、ありがとうございます！あなたのサポートは私たちにとって非常に重要です。'
        },
        about: {
            title: 'HoYo Code Senderについて',
            description: 'HoYo Code Sender は、Hoyovers の Genshin Impact、Honkai: Star Rail、Zenless Zone Zero の新しいコードを自動的に通知する Discord ボットです。',
            links: 'リンク',
            version: 'バージョン',
            inviteLink: '招待リンク',
            supportServer: 'サポートサーバー',
            vote: '投票',
            error: '情報の取得中にエラーが発生しました。もう一度お試しください',
            devbio: '開発者の自己紹介',
            donate: '寄付',
            sponsor: 'GitHub スポンサー'
        },
        dashboard: {
            title: '🌐 ウェブダッシュボード',
            description: 'HoYo Code Sender ウェブダッシュボードにアクセスして、使いやすいインターフェースでサーバー設定を管理しましょう。',
            webInterface: 'ウェブインターフェース',
            openDashboard: 'ダッシュボードを開く',
            features: 'ダッシュボード機能',
            featuresList: '• 📊 リアルタイムサーバー統計\n• ⚙️ ビジュアル設定管理\n• 🎮 ゲームロール割り当て\n• 📱 モバイル対応インターフェース\n• 🔔 通知テスト\n• 🔄 リアルタイム更新',
            requirements: '必要条件',
            requirementsList: '• Discordアカウントでのログイン\n• サーバー管理者権限\n• ボットがサーバーに参加している必要があります',
            footer: 'ウェブダッシュボードでボット設定を簡単に管理しましょう！',
            error: 'ダッシュボード情報の読み込み中にエラーが発生しました。'
        },
        deletesetup: {
            noPermission: 'このコマンドを使用する権限がありません。',
            loading: 'サーバー設定を削除しています...',
            success: 'サーバー設定が正常に削除されました。',
            noConfig: 'このサーバーの設定が見つかりませんでした。',
            error: 'サーバー設定の削除中にエラーが発生しました。',
            deletedItems: '削除されたアイテム:',
            deletedConfig: 'チャンネルとロール設定',
            deletedSettings: '通知設定',
            deletedLanguage: '言語設定'
        },
        togglegame: {
            noPermission: 'このコマンドを使用する権限がありません。',
            loading: 'リクエストを処理中...',
            enabledWithNewRole: '✅ **{game}**の通知が{role}ロールで有効になりました。',
            enabledWithExistingRole: '✅ **{game}**の通知が既存のロール{role}で有効になりました。',
            enabledNoRole: '⚠️ **{game}**の通知は有効になりましたが、ロールが設定されていません。`{command}`でロールを追加するか、誰にも言及せずに通知が送信されます。',
            disabled: '❌ **{game}**の通知が無効になりました。',
            error: 'ゲーム通知の切り替え中にエラーが発生しました。'
        }
    },
    errors: {
        general: 'エラーが発生しました。もう一度お試しください。',
        api: 'APIへの接続エラー',
        database: 'データベースエラーが発生しました',
        invalidChannel: 'エラー：設定されたチャンネルが見つかりません',
        noConfig: 'エラー：このサーバーのチャンネルが設定されていません',
        rateLimit: 'リクエストが多すぎます。後でもう一度お試しください。',
        dmNotAllowed: '❌ `/{command}` コマンドはダイレクトメッセージではなく、Discordサーバーでのみ使用できます。\n\n' +
                     'HoYo Code Sender ボットがインストールされているサーバーでこのコマンドを使用してください。'
    },
    system: {
        startup: 'Botが起動中...',
        ready: 'Botが準備完了！',
        checking: '新しいコードを確認中...',
        connected: 'データベースに接続しました',
        disconnected: 'データベースから切断されました'
    }
};