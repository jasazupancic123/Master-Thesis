import { FACE_ENCODER_API_BASE_URL } from '../const/api.const';
import { FetchUtil } from '@/lib/common/service/fetch.util';

export class FaceEncoderController {
  protected api: FetchUtil;

  constructor() {
    this.api = new FetchUtil(FACE_ENCODER_API_BASE_URL!);
    return this;
  }

  async embed(imageBase64: string) {
    return this.api.post<{ faceEmbedding: number[] }>('/embed', {
      image_base64: imageBase64,
    });
  }
}
