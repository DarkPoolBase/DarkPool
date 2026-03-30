import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class WalletOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const walletParam =
      request.params.wallet || request.body.walletAddress;

    if (walletParam && user.wallet !== walletParam.toLowerCase()) {
      throw new ForbiddenException('Wallet address mismatch');
    }

    return true;
  }
}
