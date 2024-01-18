import { getMessagesBySrcTxHash, waitForMessageReceived, Message } from '@layerzerolabs/scan-client';
import { Network } from '../../../constant/network';
import { from, merge, Observable, of, switchMap, zip, combineLatest, takeLast, timeout, EMPTY } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CrossChainIdMap } from '../const/bridge';
import { CrossChainMessage, CrossChainMessenger, MessageStatus as StandardMessageStatus } from '@eth-optimism/sdk';

export function waitingBridgeMessage(network: Network, txHash: string): Observable<Message> {
  const chainId: number = CrossChainIdMap[network];

  return from(waitForMessageReceived(chainId, txHash, 3000) as Promise<Message>);
}

export function getLayerZeroBridgeMessages(network: Network, txHash: string): Observable<Message | null> {
  const chainId: number = CrossChainIdMap[network];

  return from(getMessagesBySrcTxHash(chainId, txHash) as Promise<{ messages: Message[] }>).pipe(
    map(({ messages }) => {
      return messages.length > 0 ? messages[0] : null;
    })
  );
}

export function getStandardBridgeMessage(
  messenger: CrossChainMessenger,
  txHash: string
): Observable<CrossChainMessage> {
  return from(messenger.getMessagesByTransaction(txHash) as Promise<CrossChainMessage[]>).pipe(
    switchMap((messages: CrossChainMessage[]) => {
      const message: CrossChainMessage = messages[0];
      const status$: Observable<StandardMessageStatus> = from(messenger.getMessageStatus(message));

      return zip(of(message), status$);
    }),
    map(([message, status]) => {
      message['status'] = status;
      return message;
    }),
    timeout(30000),
    catchError(err => {
      return EMPTY;
    })
  );
}
