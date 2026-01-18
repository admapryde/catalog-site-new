declare module 'cloudinary' {
  export namespace v2 {
    interface ConfigOptions {
      cloud_name?: string;
      api_key?: string;
      api_secret?: string;
    }

    interface UploadApiOptions {
      folder?: string;
      resource_type?: string;
      public_id?: string;
    }

    function config(options: ConfigOptions): void;

    namespace uploader {
      function upload_stream(
        options: UploadApiOptions,
        callback: (error: any, result: any) => void
      ): NodeJS.WritableStream;
      
      function upload(
        file: string | Buffer | NodeJS.ReadableStream,
        options?: UploadApiOptions
      ): Promise<any>;

      function destroy(
        publicId: string,
        options?: any
      ): Promise<any>;
    }
  }

  const v2: typeof import('cloudinary').v2;
  export = v2;
}