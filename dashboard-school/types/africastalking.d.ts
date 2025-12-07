declare module 'africastalking' {
  interface Credentials {
    apiKey: string;
    username: string;
  }

  interface SMSMessage {
    to: string[];
    message: string;
    from?: string;
    enqueue?: boolean;
  }

  interface SMSResponse {
    SMSMessageData: {
      Message: string;
      Recipients: Array<{
        statusCode: number;
        number: string;
        status: string;
        cost: string;
        messageId: string;
      }>;
    };
  }

  interface SMS {
    send(options: SMSMessage): Promise<SMSResponse>;
  }

  interface ApplicationData {
    UserData?: {
      balance: string;
    };
  }

  interface Application {
    fetchApplicationData(): Promise<ApplicationData>;
  }

  interface AfricasTalkingInstance {
    SMS: SMS;
    APPLICATION: Application;
  }

  function AfricasTalking(credentials: Credentials): AfricasTalkingInstance;

  export = AfricasTalking;
}
