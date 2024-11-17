module.exports = {
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
            channelSetup: 'コード通知は{channel}に送信されます'
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