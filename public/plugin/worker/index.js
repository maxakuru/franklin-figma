// src/ui/setup.ts
globalThis.UI = true;

// src/ui/index.ts
import MessageBus from "/public/vendor/MessageBus.min.js";
(async () => {
  MessageBus.send("worker:ready");
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vcGFja2FnZXMvdWktd29ya2VyL3NyYy91aS9zZXR1cC50cyIsICIuLi8uLi8uLi9wYWNrYWdlcy91aS13b3JrZXIvc3JjL3VpL2luZGV4LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJnbG9iYWxUaGlzLlVJID0gdHJ1ZTsiLCAiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AZmlnbWEvcGx1Z2luLXR5cGluZ3MvcGx1Z2luLWFwaS5kLnRzXCIgLz5cblxuaW1wb3J0ICcuL3NldHVwJztcbmltcG9ydCBNZXNzYWdlQnVzIGZyb20gJ0BmcmFua2xpbi1maWdtYS9tZXNzYWdlcyc7XG5cbihhc3luYyAoKSA9PiB7XG4gIE1lc3NhZ2VCdXMuc2VuZCgnd29ya2VyOnJlYWR5Jyk7XG59KSgpOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxXQUFXLEtBQUs7OztBQ0doQixPQUFPLGdCQUFnQjtBQUFBLENBRXRCLFlBQVk7QUFDWCxhQUFXLEtBQUssY0FBYztBQUNoQyxHQUFHOyIsCiAgIm5hbWVzIjogW10KfQo=
