import { CommonService } from '@/common/service/common.service';
import { CreateComponent } from '@/component/type/component.type';

const commonService = CommonService.instance;

export class ComponentController {
  static URL = {
    components: () => '/component',
    componentById: (id: string) => `/component/${id}`,
  };

  static async findComponents() {
    return await commonService.api.fetch(this.URL.components());
  }

  static async updateComponent(token: string, id: string, body: CreateComponent) {
    return await commonService.api.fetch(this.URL.componentById(id), { token, method: 'PATCH', body });
  }
}