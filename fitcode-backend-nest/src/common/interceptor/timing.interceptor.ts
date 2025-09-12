import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const handler = context.getHandler().name;
        const controller = context.getClass().name;
        const elapsed = Date.now() - now;
        this.logger.log(`[${controller}.${handler}] took ${elapsed}ms`);
      }),
    );
  }
}
