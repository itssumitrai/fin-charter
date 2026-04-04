<script lang="ts">
  import Icon from '../Icon.svelte';
  import { mdiFullscreen, mdiCamera, mdiCogOutline } from '@mdi/js';

  interface Props {
    onfullscreen?: () => void;
    onscreenshot?: () => void;
    onsettings?: () => void;
  }

  let { onfullscreen, onscreenshot, onsettings }: Props = $props();
</script>

<div class="utility-buttons">
  <button class="util-btn" title="Fullscreen" aria-label="Fullscreen" onclick={onfullscreen}>
    <Icon path={mdiFullscreen} size={18} />
  </button>
  <button class="util-btn" title="Screenshot" aria-label="Screenshot" onclick={onscreenshot}>
    <Icon path={mdiCamera} size={18} />
  </button>
  <button class="util-btn" title="Settings" aria-label="Settings" onclick={onsettings}>
    <Icon path={mdiCogOutline} size={18} />
  </button>
</div>

<style>
  .utility-buttons {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .util-btn {
    background: transparent;
    border: 1px solid transparent;
    color: #758696;
    padding: 4px 6px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    line-height: 1;
    display: flex;
    align-items: center;
  }

  .util-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #d1d4dc;
  }
</style>
