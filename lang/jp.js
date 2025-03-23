const { version } = require("mongoose");
const about = require("../commands/about");

module.exports = {
    games: {
        genshin: '原神',
        hkrpg: '崩壊：スターレイル',
        nap: 'ゼンレス・ゾーン・ゼロ'
    },
    common: {
        enabled: '有効',
        disabled: '無効'
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
            loading: 'コードを読み込んでいます...'
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
            noPermission: 'このコマンドを使用する権限がありません。',
            loading: 'コード通知を設定中...',
            success: 'セットアップが正常に完了しました！',
            roleSetup: '{type}コードで{role}が言及されます',
            channelSetup: '通知は{channel}に送信されます',
            autoSendSetup: '自動送信機能: {status}',
            noRole: 'ロールが設定されていません',
            notificationsEnabled: '{game}: 通知{status}',
            notificationsDisabled: '{game}: 通知{status} {reason}',
            rolesHeader: '設定されたロール:',
            noRolesWarning: 'ロールが設定されていません。どのゲームの通知も受け取れません。',
            gameNotificationsHeader: 'ゲーム通知:',
            error: {
                permissions: '対象チャンネルでチャンネルの表示、メッセージの送信、埋め込みリンクの権限が必要です。',
                general: 'セットアップ中にエラーが発生しました。もう一度お試しください。'
            }
        },
        redeem: {
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
            redeemButton: 'クリックして引き換える'
        },
        toggleautosend: {
            loading: '自動送信設定を更新中...',
            success: '自動送信が「{status}」に設定されました',
            error: '自動送信設定の更新に失敗しました'
        },
        vote: {
            title: 'HoYo Code Senderに投票',
            description: 'Top.ggで投票して私たちをサポートしてください！あなたの投票が成長とより多くのユーザーへの到達を助けます。',
            status: '投票状況',
            hasVoted: '✅ 投票ありがとうございます！12時間後に再度投票できます。',
            hasNotVoted: '❌ まだ今日は投票していません！',
            link: '投票はこちら',
            error: '投票状況の確認中にエラーが発生しました。もう一度お試しください。'
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
        rateLimit: 'リクエストが多すぎます。後でもう一度お試しください。'
    },
    system: {
        startup: 'Botが起動中...',
        ready: 'Botが準備完了！',
        checking: '新しいコードを確認中...',
        connected: 'データベースに接続しました',
        disconnected: 'データベースから切断されました'
    }
};