import { Fetcher } from "@utils/fetcher";
import { AsyncFn, Fn } from "@utils/types";

export class TwitterAuth {
    private readonly tasks: Array<AsyncFn<void, void>> = [];
    private flowToken = "";

    public constructor(
        private readonly fetcher: Fetcher,
        private readonly getHeaders: Fn<void, Record<string, string>>,
        private readonly guestTokenHandler: Fn<string>,
    ) {}

    public doInstrumentation() {
        this.tasks.push(async () => {
            const data = await this.fetcher.fetchJson<{ flow_token: string }>(
                "https://twitter.com/i/api/1.1/onboarding/task.json",
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        flow_token: this.flowToken,
                        subtask_inputs: [
                            {
                                subtask_id: "LoginJsInstrumentationSubtask",
                                js_instrumentation: {
                                    response: JSON.stringify({
                                        rf: {
                                            eca553b518cf2bf0dac5687d57cc1857738793960864216fb28429c367b1074c: 96,
                                            bf7ee80b5b9e0822c133ba94f7c8fa22efadc740ccfe7e83a8907335d7668441: 128,
                                            aea7b2935d0508b33d370215bb57788afe530c7250f289c4e2f347579a363c98: 154,
                                            aa1900ce941819d2ce7b3985d94c4b05781f7b9bd3b2389cd1b28f1b8156ebc8: -115,
                                        },
                                        s: "CKq_55Z6_WsJSB5d7xiFWMeLaWUckgaJw1bADMTt3WNVnsZGXlu4q9EDeem5Azx-pPMUR8M2_VRpnn0411iltwDyynQKh_ONDxmO52V2TrialbGMyy1Zh-J1Xj_xeXDRI-DPpTG-xe7qTtzMZj8i60xSwZv15BV0S496tJ00pSNlfYBEk-YK85q2kO3cGQg7ZPoHDjxIJPRcintmYd9ioVMFTMYcmrnhGkpk6Qf7GqwbL1XEkAAtuqB33AD_xH-V3P3Dl2z4RQQsL-xL6-LwuEtJW4F6l91N4Fqx0jCN9AaP42CM-tMNu0lJvZw32QTGhE8VzFg1Db26CTym4q9qlAAAAYTGoKew",
                                    }),
                                    link: "next_link",
                                },
                            },
                        ],
                    }),
                },
            );

            this.flowToken = data.flow_token;
        });

        return this;
    }
    public setUserId(userId: string) {
        this.tasks.push(async () => {
            const data = await this.fetcher.fetchJson<{ flow_token: string }>(
                "https://twitter.com/i/api/1.1/onboarding/task.json",
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        flow_token: this.flowToken,
                        subtask_inputs: [
                            {
                                subtask_id: "LoginEnterUserIdentifierSSO",
                                settings_list: {
                                    setting_responses: [
                                        { key: "user_identifier", response_data: { text_data: { result: userId } } },
                                    ],
                                    link: "next_link",
                                },
                            },
                        ],
                    }),
                },
            );

            this.flowToken = data.flow_token;
        });

        return this;
    }
    public setPassword(password: string) {
        this.tasks.push(async () => {
            const data = await this.fetcher.fetchJson<{ flow_token: string }>(
                "https://twitter.com/i/api/1.1/onboarding/task.json",
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        flow_token: this.flowToken,
                        subtask_inputs: [
                            {
                                subtask_id: "LoginEnterPassword",
                                enter_password: { password, link: "next_link" },
                            },
                        ],
                    }),
                },
            );

            this.flowToken = data.flow_token;
        });

        return this;
    }
    public doDuplicationCheck() {
        this.tasks.push(async () => {
            const data = await this.fetcher.fetchJson<{ flow_token: string }>(
                "https://twitter.com/i/api/1.1/onboarding/task.json",
                {
                    method: "POST",
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        flow_token: this.flowToken,
                        subtask_inputs: [
                            {
                                subtask_id: "AccountDuplicationCheck",
                                check_logged_in_account: { link: "AccountDuplicationCheck_false" },
                            },
                        ],
                    }),
                },
            );

            this.flowToken = data.flow_token;
        });

        return this;
    }

    public async action() {
        const { guest_token } = await this.fetcher.fetchJson<{ guest_token: string }>(
            "https://api.twitter.com/1.1/guest/activate.json",
            {
                method: "POST",
                headers: this.getHeaders(),
            },
        );

        this.guestTokenHandler(guest_token);

        const { flow_token } = await this.fetcher.fetchJson<{ flow_token: string }>(
            "https://twitter.com/i/api/1.1/onboarding/task.json?flow_name=login",
            {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    input_flow_data: {
                        flow_context: { debug_overrides: {}, start_location: { location: "manual_link" } },
                    },
                    subtask_versions: {
                        action_list: 2,
                        alert_dialog: 1,
                        app_download_cta: 1,
                        check_logged_in_account: 1,
                        choice_selection: 3,
                        contacts_live_sync_permission_prompt: 0,
                        cta: 7,
                        email_verification: 2,
                        end_flow: 1,
                        enter_date: 1,
                        enter_email: 2,
                        enter_password: 5,
                        enter_phone: 2,
                        enter_recaptcha: 1,
                        enter_text: 5,
                        enter_username: 2,
                        generic_urt: 3,
                        in_app_notification: 1,
                        interest_picker: 3,
                        js_instrumentation: 1,
                        menu_dialog: 1,
                        notifications_permission_prompt: 2,
                        open_account: 2,
                        open_home_timeline: 1,
                        open_link: 1,
                        phone_verification: 4,
                        privacy_options: 1,
                        security_key: 3,
                        select_avatar: 4,
                        select_banner: 2,
                        settings_list: 7,
                        show_code: 1,
                        sign_up: 2,
                        sign_up_review: 4,
                        tweet_selection_urt: 1,
                        update_users: 1,
                        upload_media: 1,
                        user_recommendations_list: 4,
                        user_recommendations_urt: 1,
                        wait_spinner: 3,
                        web_modal: 1,
                    },
                }),
            },
        );

        this.flowToken = flow_token;

        for (const task of this.tasks) {
            await task();
        }
    }
}
