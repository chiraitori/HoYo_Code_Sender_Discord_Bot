module.exports = {
    games: {
        genshin: '原神',
        hkrpg: '崩壊：スターレイル',
        nap: 'ゼンレスゾーンゼロ'
    },
    common: {
        enabled: '有効',
        disabled: '無効',
        notYourButton: 'このボタンはコマンドを実行したユーザーのみ操作できます。',
        supportMsg: 'サポート: github.com/sponsors/chiraitori | chiraitori.dev'
    },
    welcome: {
        title: 'HoYo Code Sender を導入いただきありがとうございます',
        description: 'HoYoverse タイトルの最新シリアルコード（交換コード）をサーバーへ自動配信します。',
        setupHeader: '🔧 クイックセットアップ',
        setupSteps:
            '1. `/setup` で通知先チャンネルとメンション用ロールを設定します。\n' +
            '2. （任意）`/favgames` で通知を受け取るゲームを選択します。\n' +
            '3. （任意）`/setlang` で表示言語（`en` / `jp` / `vi`）を切り替えます。\n\n' +
            '設定完了後、新しいコードが公開され次第自動で投稿されます。',
        helpTip: 'コマンド一覧はいつでも `/help` で確認できます。',
        footer: 'HoYo Code Sender',
        dmInfo: 'サーバー内に書き込み可能なチャンネルが見つからなかったため、セットアップ案内を DM でお送りしました。'
    },
    commands: {
        setlang: {
            noPermission: 'このコマンドを実行するには管理者権限が必要です。',
            success: 'サーバーの表示言語を **{language}** に設定しました。',
            error: 'サーバー言語の変更に失敗しました。',
            description: 'このサーバーでのBot表示言語を設定します',
            languageOption: '言語を選択'
        },
        checkchannels: {
            noPermission: 'このコマンドを実行するには管理者権限が必要です。'
        },
        listcodes: {
            title: '{game} 有効な交換コード一覧',
            noCodes: '現在、{game} の有効なコードはありません。',
            reward: '報酬: {reward}',
            status: '状態: {status}',
            redeemButton: 'コードを入力する',
            redeemHeader: '交換リンク',
            newCodes: '{game} 新着コード！',
            noReward: '報酬情報なし',
            error: {
                fetch: 'コード情報の取得に失敗しました。しばらくしてから再度お試しください。',
                invalid: 'コードAPIから無効な応答が返されました。',
                notFound: '利用可能なコードがありません。'
            },
            loading: 'コードを取得中...',
            page: 'ページ'
        },
        setup: {
            description: 'コード通知用のチャンネルとロールを設定します',
            genshinRole: '原神の通知でメンションするロール',
            hsrRole: '崩壊：スターレイルの通知でメンションするロール',
            zzzRole: 'ゼンレスゾーンゼロの通知でメンションするロール',
            forumThreadHeader: '🧵 フォーラムスレッド',
            forumThreadSuccess: '✅ このスレッドにもコードが投稿されます。',
            forumThreadWarning: '⚠️ 指定されたスレッドが無効か、Botに送信権限がないためスキップされました。',
            channel: 'コード通知を送信するチャンネル',
            success: 'サーバー設定を保存しました',
            roleSetup: '{type} の通知ロールを {role} に設定しました',
            channelSetup: '{channel} にコード通知を送信します',
            autoSendSetup: '自動送信: {status}',
            noPermission: 'このコマンドを実行するには管理者権限が必要です。',
            channelValidation: '✅ チャンネル権限を確認しました。メッセージと埋め込みリンクを送信できます。',
            readyMessage: '交換コードの自動通知を受け取る準備が完了しました。',
            rolesHeader: '🎭 通知ロール',
            channelHeader: '📣 通知チャンネル',
            autoSendHeader: '⚙️ 自動送信',
            demoTipHeader: '💡 動作テスト',
            demoTipText: '`/demoautosend` を実行すると、設定したチャンネルへテスト通知を送信できます。',
            error: {
                channelValidation: 'チャンネルの確認に失敗しました'
            }
        },
        deletesetup: {
            noPermission: 'このコマンドを実行するには管理者権限が必要です。',
            loading: 'サーバー設定を削除中...',
            success: 'サーバー設定をすべてリセットしました。',
            noConfig: 'このサーバーには保存された設定がありません。',
            error: 'サーバー設定の削除に失敗しました。',
            deletedItemsHeader: '削除した項目:',
            deletedItems: '削除した項目:',
            deletedConfig: '通知チャンネル・スレッド・ロール設定',
            deletedSettings: '自動送信・ゲームフィルター設定',
            deletedLanguage: '言語設定'
        },
        demoautosend: {
            noPermission: 'このコマンドを実行するには管理者権限が必要です。',
            noConfig: '通知チャンネルが未設定です。先に `/setup` を実行してください。',
            channelError: '設定されたチャンネルにメッセージを送信できません:',
            title: '🔔 {game} テスト通知',
            notice: '⚠️ テスト配信',
            noticeText: 'これは通知設定を確認するためのサンプルコードです。ゲーム内では使用できません。',
            success: '{count} タイトルのテスト通知を送信しました。',
            error: 'テスト通知の送信に失敗しました。'
        },
        postcode: {
            modalTitle: '交換コードを手動投稿',
            inputLabels: {
                games: 'ゲーム (genshin / hsr / zzz)',
                code1: 'コード 1（必須）',
                code2: 'コード 2（任意）',
                code3: 'コード 3（任意）',
                message: 'メモ・補足（任意）'
            },
            description: '交換コードを設定済みチャンネルへ手動で投稿します',
            success: '交換コードをチャンネルに投稿しました。',
            error: 'コードの投稿に失敗しました。',
            noPermission: 'このコマンドを実行するには管理者権限が必要です。',
            embedTitle: '{game} 新着交換コード',
            embedDescription: '{game} の交換コードが投稿されました。',
            messageLabel: 'メモ',
            redeemButton: 'コードを入力する',
            postcodeButton: 'コードを入力する',
            invalidGame: 'ゲーム指定が無効です。`genshin`、`hsr`、`zzz` のいずれかを入力してください。',
            noCode: 'コードを1つ以上入力してください。'
        },
        toggleautosend: {
            loading: '自動送信設定を更新中...',
            success: '自動送信を **{status}** に変更しました。',
            error: '自動送信設定の更新に失敗しました。',
            noPermission: 'このコマンドを実行するには管理者権限が必要です。'
        },
        autosendoptions: {
            noPermission: 'このコマンドを実行するには管理者権限が必要です。',
            success: '✅ 自動送信の投稿先を更新しました。',
            warning: {
                autoSendDisabled: '⚠️ 自動送信は現在 **無効** です。先に `/toggleautosend status:Enable` で有効にしてください。'
            },
            error: {
                bothDisabled: '⚠️ メインチャンネルとスレッドの両方を無効にはできません。少なくとも片方を有効にしてください。',
                general: '自動送信の投稿先設定の更新に失敗しました。'
            }
        },
        favgames: {
            noPermission: 'このコマンドを実行するには管理者権限が必要です。',
            loading: '対象ゲーム設定を更新中...',
            success: '通知対象のゲーム設定を保存しました。',
            error: '対象ゲーム設定の更新に失敗しました。',
            filterStatus: 'ゲームフィルター: **{status}**',
            gameStatusHeader: '通知対象ゲーム:',
            allGamesEnabled: 'すべてのゲームの通知を受け取ります。'
        },
        help: {
            title: 'HoYo Code Sender ヘルプ',
            description: '原神・崩壊：スターレイル・ゼンレスゾーンゼロの新しい交換コードを Discord サーバーへ自動配信します。',
            setupHeader: '📌 基本セットアップ',
            setupSteps:
                '1. `/setup` で通知チャンネル・各ゲームの通知ロール・自動送信を設定します。\n' +
                '2. 必要に応じて詳細設定を行います：\n' +
                '   • `/livestreamcodesetup` — 予告番組（生放送）コード用の専用チャンネルを設定\n' +
                '   • `/setupthread` — ゲームごとにフォーラムスレッドへ振り分け\n' +
                '   • `/favgames` — 通知を受け取るゲームを絞り込み\n' +
                '   • `/setlang` — 表示言語を変更（英語 / 日本語 / ベトナム語）',
            commandsHeader: '📋 コマンド一覧',
            commandsList:
                '• `/setup` — 通知チャンネル・ロール・自動送信の初期設定\n' +
                '• `/livestreamcodesetup` — 生放送コード専用チャンネル・予告通知の設定\n' +
                '• `/setupthread` — 各ゲームの投稿先フォーラムスレッドを設定\n' +
                '• `/autosendoptions` — メインチャンネル／スレッドの投稿先を切り替え\n' +
                '• `/favgames` — 通知を受け取るゲームを選択\n' +
                '• `/toggleautosend` — 自動送信のオン／オフを切り替え\n' +
                '• `/listcodes` — 現在有効なコード一覧を表示\n' +
                '• `/postcode` — コードを手動でチャンネルへ投稿\n' +
                '• `/checkchannels` — 通知チャンネルのBot権限を確認\n' +
                '• `/demoautosend` — テスト通知を送信\n' +
                '• `/setlang` — 表示言語を変更（`en` / `jp` / `vi`）\n' +
                '• `/deletesetup` — サーバー設定をすべてリセット\n' +
                '• `/dashboard` — Webダッシュボードのリンクを表示\n' +
                '• `/vote` — Top.gg の投票状況を確認\n' +
                '• `/about` — Botのバージョンと各種リンクを表示\n' +
                '• `/help` — このヘルプを表示',
            tipsHeader: '💡 ポイント',
            tipsList:
                '• 新着コードは5分おき、および予告番組の配信中に自動チェックされます。\n' +
                '• 通知内のリンクを開くと、コードが自動入力された状態で公式交換ページへ移動します。\n' +
                '• 通知が届かない場合は `/checkchannels` でBotの権限を確認してください。',
            footer: 'HoYo Code Sender',
            error: 'ヘルプ情報の読み込みに失敗しました。'
        },
        vote: {
            title: 'HoYo Code Sender に投票',
            description: 'Top.gg での投票で HoYo Code Sender を応援していただけると幸いです。',
            status: '投票ステータス',
            hasVoted: '✅ 直近12時間以内に投票済みです。ご協力ありがとうございます！',
            hasNotVoted: '❌ 直近12時間以内の投票はまだありません。',
            link: 'Top.gg で投票する',
            error: '投票ステータスの確認に失敗しました。',
            thankTitle: '投票ありがとうございます！🎉',
            thankMessage: '{user} さん、Top.gg で HoYo Code Sender に投票いただきありがとうございます！',
            voteAgain: '12時間ごとに再投票できます。',
            dmThankTitle: '投票ありがとうございます！',
            dmThankMessage: 'Top.gg で HoYo Code Sender に投票いただきありがとうございます！'
        },
        about: {
            title: 'HoYo Code Sender について',
            description: 'HoYoverse タイトル（原神・崩壊：スターレイル・ゼンレスゾーンゼロ）の交換コードを自動配信する Discord Bot です。',
            links: 'リンク',
            version: 'バージョン',
            sourceCode: 'ソースコード',
            inviteLink: '招待リンク',
            supportServer: 'サポートサーバー',
            vote: 'Top.gg で投票',
            github: 'GitHub リポジトリ',
            error: 'Bot情報の取得に失敗しました。',
            devbio: '開発者 Webサイト',
            donate: '寄付・支援',
            sponsor: 'GitHub Sponsors'
        },
        dashboard: {
            title: '🌐 Webダッシュボード',
            description: 'Webダッシュボードから通知チャンネル、フォーラムスレッド、ロール、言語設定、手動コード投稿をまとめて管理できます。',
            webInterface: 'ダッシュボード URL',
            openDashboard: 'ダッシュボードを開く',
            features: '主な機能',
            featuresList:
                '• 📣 通常・生放送コードの通知チャンネル設定\n' +
                '• 🧵 ゲーム別フォーラムスレッドの割り当て\n' +
                '• 🎭 ゲーム別メンションロールの設定\n' +
                '• 🎮 通知対象ゲームの絞り込み・言語切り替え\n' +
                '• 📝 手動コード投稿とチャンネル権限チェック',
            requirements: '利用条件',
            requirementsList:
                '• Discord アカウントでのログイン\n' +
                '• サーバー所有者または管理者／チャンネル管理権限\n' +
                '• 対象サーバーに HoYo Code Sender が導入済みであること',
            footer: 'HoYo Code Sender Dashboard',
            error: 'ダッシュボード情報の読み込みに失敗しました。'
        },
        togglegame: {
            noPermission: 'このコマンドを実行するには管理者権限が必要です。',
            loading: '設定を更新中...',
            enabledWithNewRole: '✅ **{game}** の通知を有効にし、ロール {role} を設定しました。',
            enabledWithExistingRole: '✅ **{game}** の通知を既存ロール {role} で有効にしました。',
            enabledNoRole: '⚠️ **{game}** の通知を有効にしましたが、ロールが未設定です。`{command}` でロールを指定できます。',
            disabled: '❌ **{game}** の通知を無効にしました。',
            error: 'ゲーム通知設定の切り替えに失敗しました。'
        },
        sendtothread: {
            noPermission: 'このコマンドを実行するには管理者権限が必要です。',
            noActiveCodes: '{game} の有効なコードが見つかりません。',
            success: '✅ {game} の有効なコード {count} 件をスレッド「{thread}」に送信しました。',
            instructions: '**交換手順:**\n1. 上のリンクを開く\n2. HoYoverse アカウントでログイン\n3. コードを確認して送信し、ゲーム内メールから報酬を受け取る',
            error: {
                notThread: '選択されたチャンネルはスレッドではありません。フォーラムスレッドを選択してください。',
                noPermission: '指定されたスレッドでメッセージを送信する権限がありません。',
                general: 'スレッドへのコード送信中にエラーが発生しました。'
            }
        },
        setupthread: {
            noPermission: 'このコマンドを実行するには管理者権限が必要です。',
            success: '✅ フォーラムスレッドを設定しました。今後各ゲームのコードは専用スレッドに投稿されます。',
            error: {
                notThread: '選択されたチャンネルの中にフォーラムスレッドではないものが含まれています。',
                noPermission: '選択されたスレッドのいずれかでメッセージ送信または埋め込みリンクの権限がありません。',
                noSetup: '先に `/setup` でメイン通知チャンネルを設定してください。',
                general: 'フォーラムスレッドの設定中にエラーが発生しました。'
            }
        },
        livestreamcodesetup: {
            setupRequiredTitle: '⚠️ 初期設定が必要です',
            setupRequired: '生放送コード用チャンネルを設定する前に、`/setup` でメイン通知チャンネルを設定してください。',
            title: '📺 生放送コード通知チャンネル設定',
            currentSetting: '現在の設定',
            usingMainChannel: 'メインチャンネルを使用中: {channel}',
            notConfigured: '未設定',
            behavior: '配信先',
            dedicatedBehavior: '✅ 生放送コードは専用チャンネルに送信されます。',
            mainBehavior: 'ℹ️ 生放送コードは通常コードと同じメインチャンネルに送信されます。',
            announcementStatus: '予告番組アナウンス',
            announcementEnabled: '✅ 予告番組の配信スケジュール通知は有効です。',
            announcementDisabled: '❌ 予告番組の配信スケジュール通知は無効です。',
            removedTitle: '✅ 生放送用チャンネルを解除しました',
            removedDescription: '今後、生放送コードはメイン通知チャンネルに送信されます。',
            mainChannel: 'メインチャンネル',
            channelRequiredTitle: '❌ チャンネルを選択してください',
            channelRequired: '「Set Channel」を選択した場合は通知先チャンネルを指定してください。',
            insufficientPermissionsTitle: '⚠️ 権限が不足しています',
            insufficientPermissions: '{channel} で必要な権限が Bot に付与されていません。',
            requiredPermissions: '必要な権限',
            requiredPermissionsValue: '• チャンネルを見る\n• メッセージを送信\n• 埋め込みリンク',
            configuredTitle: '✅ 生放送用チャンネルを保存しました',
            configuredDescription: '予告番組（生放送）の交換コードはこの専用チャンネルへ送信されます。',
            livestreamCodes: '📺 生放送コード',
            regularCodes: '📋 通常コード',
            whatHappensNow: '💡 配信ルート',
            whatHappensNowValue:
                '• 通常コード → メインチャンネル（または各ゲームのスレッド）\n' +
                '• 予告番組コード → 生放送専用チャンネル\n' +
                '• 予告番組の配信告知 → 生放送専用チャンネル',
            announcementEnabledTitle: '✅ 予告番組アナウンスを有効化しました',
            announcementEnabledDescription: '予告番組の放送が決定した際、自動的にスケジュール告知を送信します。',
            announcementDisabledTitle: '❌ 予告番組アナウンスを無効化しました',
            announcementDisabledDescription: 'スケジュール告知は送信されません（生放送コードの自動配信は引き続き行われます）。',
            errorTitle: '❌ エラー',
            errorDescription: '生放送チャンネル設定の更新中にエラーが発生しました。',
            errorFooter: 'Botの権限を確認してから再度お試しください。'
        }
    },
    livestream: {
        codes: {
            title: '{game} 予告番組コード',
            description: 'バージョン {version} — コード {count} 件',
            code: 'コード {number}',
            expires: '有効期限',
            unknownExpiry: '不明',
            redeemHere: '交換リンク',
            redeem: 'コードを入力する'
        },
        announcement: {
            content: '📢 **{game} 予告番組のお知らせ**',
            title: '📺 {game} 予告番組 配信決定',
            description: '**バージョン {version}** 予告番組の配信スケジュールが公開されました。',
            streamTime: '📅 配信日時',
            estimatedStreamTime: '📅 推定配信日時',
            whatToExpect: '🎁 放送内容',
            whatToExpectValue: '• 次期バージョンの最新情報\n• 期間限定の交換コード配布\n• 新キャラクター・イベント紹介',
            watchOnYoutube: '▶️ YouTube で視聴する',
            status: {
                live: '配信中',
                upcoming: '配信予定',
                officialChannel: '公式チャンネル'
            }
        }
    },
    errors: {
        general: 'エラーが発生しました。もう一度お試しください。',
        api: '外部APIへの接続に失敗しました。',
        database: 'データベースエラーが発生しました。',
        invalidChannel: '設定されている通知チャンネルが見つかりません。',
        noConfig: 'このサーバーには通知チャンネルが設定されていません。先に `/setup` を実行してください。',
        rateLimit: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
        dmNotAllowed:
            '❌ `/{command}` はダイレクトメッセージでは使用できません。\n\n' +
            'HoYo Code Sender が導入されている Discord サーバー内で実行してください。'
    },
    system: {
        startup: 'Botを起動中...',
        ready: 'Botがオンラインになりました。',
        checking: '新着コードを確認中...',
        connected: 'データベースに接続しました。',
        disconnected: 'データベースから切断されました。'
    }
};
