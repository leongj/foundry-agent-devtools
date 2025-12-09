# Frontend Code Refactoring Plan

## Identified Redundancies

### 1. Duplicate `extractContentText` function
- **Location 1:** `ui/src/utils.js` - exported as `extractTextFromContent`
- **Location 2:** `ui/src/components/Conversations.jsx` - local function `extractContentText`
- **Location 3:** `ui/src/components/Responses.jsx` - local function `extractContentText`

**Action:** Consolidate into `utils.js` and import where needed.

### 2. Duplicate `countAnnotations` function
- **Location 1:** `ui/src/components/Conversations.jsx`
- **Location 2:** `ui/src/components/Responses.jsx`

**Action:** Move to `utils.js` as shared utility.

### 3. Duplicate `ClickableId` component
- **Location 1:** `ui/src/components/Conversations.jsx` (lines 140-159)
- **Location 2:** `ui/src/components/Responses.jsx` (lines 38-63)

**Action:** Extract to `ui/src/components/ClickableId.jsx` as shared component.

### 4. Duplicate rendering logic for timeline items
- `ConversationItem` component in Conversations.jsx
- `OutputItem` component in Responses.jsx

Nearly identical logic for rendering:
- Message items
- File search calls
- Code interpreter calls
- Unknown/generic fallback types

**Action:** Create unified `ui/src/components/TimelineItem.jsx` component.

### 5. Duplicate error handling pattern in hooks
All hooks in `ui/src/hooks.js` use identical error handling pattern.

**Action:** Extract to shared utility function.

### 6. Unused components
- `AgentsList`, `ConversationsList`, `ResponsesList` - Card-based list components
- `AgentCard`, `ConversationCard`, `ResponseCard` - Only used by unused lists

**Action:** Remove if not planned for future use.

## Implementation Order

1. ✅ Create recommendations file
2. ✅ Add utility functions to `utils.js` (`countAnnotations`, standardize `extractContentText`)
3. ✅ Create shared `ClickableId` component
4. ✅ Create unified `TimelineItem` component
5. ✅ Update `Conversations.jsx` to use shared components
6. ✅ Update `Responses.jsx` to use shared components
7. ✅ Extract error handling utility in hooks
8. ✅ Remove unused card/list components
9. ✅ Test all functionality - No errors found!

## Completion Summary

**All tasks completed successfully!**

### Changes Made:

1. **utils.js** - Added `countAnnotations()` and improved `extractContentText()` to handle all content formats, plus added `parseErrorResponse()` for consistent error handling
2. **components/ClickableId.jsx** - New shared component for clickable IDs with copy-to-clipboard
3. **components/TimelineItem.jsx** - New unified component for rendering all timeline item types (messages, file search calls, code interpreter calls)
4. **components/Conversations.jsx** - Removed ~250 lines of duplicate code, now uses shared components
5. **components/Responses.jsx** - Removed ~250 lines of duplicate code, now uses shared components
6. **hooks.js** - Replaced 5 instances of duplicate error handling with shared utility
7. **components/Agents.jsx** - Removed unused `AgentCard` and `AgentsList` components (~50 lines)
8. **App.jsx** - Updated imports to remove references to deleted components

## Expected Benefits

- **Reduced code duplication:** ~400+ lines of redundant code eliminated
- **Improved maintainability:** Changes in one place affect all usages
- **Smaller bundle size:** Less JavaScript to download and parse
- **Consistency:** Shared components ensure UI consistency
