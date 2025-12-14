<template>
  <div class="w-full h-0.5 bg-gray-200 relative overflow-hidden">
    <div class="absolute top-0 left-0 h-full bg-blue-600 animate-loading-bar"></div>
  </div>
</template>

<style scoped>
@keyframes loading-bar {
  0% {
    width: 0%;
    left: 0%;
  }
  50% {
    width: 70%;
    left: 15%;
  }
  100% {
    width: 0%;
    left: 100%;
  }
}

.animate-loading-bar {
  animation: loading-bar 1.5s ease-in-out infinite;
}
</style>
