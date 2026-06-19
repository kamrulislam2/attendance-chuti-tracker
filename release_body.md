# Release Notes — Chuti v1.1.0

We are excited to announce the release of **Chuti v1.1.0**, featuring premium skeleton loading views, layout stabilization improvements, and crucial UI formatting bug fixes.

## 🚀 Key Improvements

### 💫 High-Fidelity Skeleton Loaders
* **Shimmering UI Loaders**: Replaced all full-screen loaders and simple inline spin elements with layout-specific, shimmering skeletons. This includes customized variants for:
  - Leaves Records Table
  - Staff Leave Master Table
  - Settlements Panel
  - Govt Holiday Responses Table
  - Dashboard Page Loading Shell (instant shell mock layout before initial fetch)

### 🧩 Layout Shift Prevention
* **Rendering Gates**: Wrapped rendering blocks in strict conditional boundaries so dashboard metrics and data tables don't render empty configurations or cause sudden layout shifts during asynchronous state loading.

### 🐛 Bug Fixes
* **Admin Profile Header Formatting**: Resolved a bug in the profile header where empty parentheses `()` were rendered on load/reload before profile data resolved. 
* **Syntax & Compile Errors**: Corrected a typo/syntax issue (`v>`) inside the settlements layout and verified zero TypeScript warnings.
