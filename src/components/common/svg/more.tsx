import { SvgProps } from './svg-props';
import { px } from './util-function';

export function MoreIcon(props: SvgProps) {
  return (
    <svg
      version="1.1"
      width={px(props.width)}
      height={px(props.height)}
      fill={props.fill ? props.fill : 'currentColor'}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 60"
    >
      <g>
        <path d="M30,16c4.411,0,8-3.589,8-8s-3.589-8-8-8s-8,3.589-8,8S25.589,16,30,16z" />
        <path d="M30,44c-4.411,0-8,3.589-8,8s3.589,8,8,8s8-3.589,8-8S34.411,44,30,44z" />
        <path d="M30,22c-4.411,0-8,3.589-8,8s3.589,8,8,8s8-3.589,8-8S34.411,22,30,22z" />
      </g>
    </svg>
  );
}
