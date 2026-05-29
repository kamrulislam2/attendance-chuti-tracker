import fs from 'fs';

const filePath = './src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace all 10 catch blocks with errorHandler usage
const replacements = [
  // 1. Line 986 - handleSubmit
  {
    find: `    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'ডাটা সাবমিট করার সময় ত্রুটি ঘটেছে।' });
    } finally {
      setSubmitting(false);`,
    replace: `    } catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setMessage({ type: 'error', text: errorInfo.userMessage });
    } finally {
      setSubmitting(false);`
  },
  // 2. Line 1033 - handleDeleteRecord
  {
    find: `      setMessage({ type: 'success', text: 'রেকর্ডটি সফলভাবে ডিলিট করা হয়েছে।' });
      fetchRecords();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'রেকর্ডটি ডিলিট করতে সমস্যা হয়েছে।' });
    } finally {
      setDeletingRecord(false);`,
    replace: `      setMessage({ type: 'success', text: 'রেকর্ডটি সফলভাবে ডিলিট করা হয়েছে।' });
      fetchRecords();
    } catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setMessage({ type: 'error', text: errorInfo.userMessage });
    } finally {
      setDeletingRecord(false);`
  },
  // 3. Line 1146 - handleCancelAdjustmentRequest
  {
    find: `      fetchRecords();
      setMessage({ type: 'success', text: 'ছুটি সমন্বয় সফলভাবে বাতিল করা হয়েছে।' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'সমন্বয় বাতিল করতে সমস্যা হয়েছে।' });
    } finally {
      setShowCancelAdjustmentModal(false);`,
    replace: `      fetchRecords();
      setMessage({ type: 'success', text: 'ছুটি সমন্বয় সফলভাবে বাতিল করা হয়েছে।' });
    } catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setMessage({ type: 'error', text: errorInfo.userMessage });
    } finally {
      setShowCancelAdjustmentModal(false);`
  },
  // 4. Line 1242 - handleSubmitAdjustmentRequest
  {
    find: `          : 'সমন্বয় অনুরোধ সফলভাবে পাঠানো হয়েছে এবং অনুমোদনের অপেক্ষায় রয়েছে।'
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'সমন্বয় করতে সমস্যা হয়েছে।' });
    } finally {
      setShowAdjustmentModal(false);`,
    replace: `          : 'সমন্বয় অনুরোধ সফলভাবে পাঠানো হয়েছে এবং অনুমোদনের অপেক্ষায় রয়েছে।'
      });
    } catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setMessage({ type: 'error', text: errorInfo.userMessage });
    } finally {
      setShowAdjustmentModal(false);`
  },
  // 5. Line 1452 - handleApproveAdminRequest (replace the manual error handling with errorHandler)
  {
    find: `    } catch (err: any) {
      let errorMsg = err.message || 'অনুরোধ পাঠাতে সমস্যা হয়েছে।';
      if (err.code === '23505' || errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('unique')) {
        errorMsg = 'এই কোডনেমটি ইতিমধ্যে ব্যবহার করা হচ্ছে! অন্য একটি কোডনেম ব্যবহার করুন।';
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {`,
    replace: `    } catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setMessage({ type: 'error', text: errorInfo.userMessage });
    } finally {`
  },
  // 6. Line 1497 - handleFirstTimeSetup
  {
    find: `      setMessage({ type: 'success', text: 'আপনার প্রোফাইল সেটআপ সফলভাবে সম্পন্ন হয়েছে!' });
    } catch (err: any) {
      setSetupError(err.message || 'সেটআপ আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setSetupSubmitting(false);`,
    replace: `      setMessage({ type: 'success', text: 'আপনার প্রোফাইল সেটআপ সফলভাবে সম্পন্ন হয়েছে!' });
    } catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setSetupError(errorInfo.userMessage);
    } finally {
      setSetupSubmitting(false);`
  },
  // 7. Line 1568 - handleFirstTimePasswordChange
  {
    find: `      }, 10000);
      setMessage({ type: 'success', text: 'পাসওয়ার্ড পরিবর্তন সফল হয়েছে!' });
    } catch (err: any) {
      setFirstTimePasswordError(err.message || 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setFirstTimePasswordSubmitting(false);`,
    replace: `      }, 10000);
      setMessage({ type: 'success', text: 'পাসওয়ার্ড পরিবর্তন সফল হয়েছে!' });
    } catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setFirstTimePasswordError(errorInfo.userMessage);
    } finally {
      setFirstTimePasswordSubmitting(false);`
  },
  // 8. Line 2046 - handleCreateUser
  {
    find: `      setNewStaffAllowOvertime(false);
      fetchRecords();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'ইউজার তৈরি করতে ব্যর্থ: ' + err.message });
    } finally {
      setCreatingUser(false);`,
    replace: `      setNewStaffAllowOvertime(false);
      fetchRecords();
    } catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setMessage({ type: 'error', text: errorInfo.userMessage });
    } finally {
      setCreatingUser(false);`
  },
  // 9. Line 2083 - handleUpdateCredentials
  {
    find: `      setCredConfirmPassword('');
      fetchRecords();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'ক্রিডেনশিয়াল আপডেট করতে ব্যর্থ: ' + err.message });
    } finally {
      setUpdatingCredentials(false);`,
    replace: `      setCredConfirmPassword('');
      fetchRecords();
    } catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setMessage({ type: 'error', text: errorInfo.userMessage });
    } finally {
      setUpdatingCredentials(false);`
  },
  // 10. Line 2108 - handleDeleteUser
  {
    find: `      setViewingStaffId(null);
      fetchRecords();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'ইউজার মুছে ফেলতে ব্যর্থ: ' + err.message });
    } finally {
      setDeletingUser(false);`,
    replace: `      setViewingStaffId(null);
      fetchRecords();
    } catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setMessage({ type: 'error', text: errorInfo.userMessage });
    } finally {
      setDeletingUser(false);`
  }
];

let updated = 0;
for (const {find, replace} of replacements) {
  if (content.includes(find)) {
    content = content.replace(find, replace);
    updated++;
    console.log(`✓ Replaced catch block #${updated}`);
  } else {
    console.log(`✗ Could not find replacement #${updated}`);
  }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log(`\n✅ Updated ${updated}/10 catch blocks`);
