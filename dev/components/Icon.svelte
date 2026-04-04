<script lang="ts">
  interface Props {
    path: string;
    size?: number;
    color?: string;
  }

  let { path, size = 18, color = 'currentColor' }: Props = $props();
</script>

<svg
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill={color}
  style="display:inline-block;vertical-align:middle;"
>
  <path d={path} />
</svg>
