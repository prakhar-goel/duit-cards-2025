package io.duit.ecards.pilot

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest
import com.google.android.gms.auth.api.identity.Identity

/** A user-approved SIM hint only. It never verifies identity or sends an SMS. */
class PhoneNumberHintModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context), LifecycleEventListener {
  private var pending: Promise? = null
  private val requestCode = 47321
  private val resultListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, code: Int, resultCode: Int, data: Intent?) {
      if (code != requestCode) return
      val promise = pending ?: return
      pending = null
      if (resultCode != Activity.RESULT_OK) {
        promise.resolve(null)
        return
      }
      try {
        if (data == null) throw IllegalStateException("Missing phone hint")
        promise.resolve(Identity.getSignInClient(activity).getPhoneNumberFromIntent(data))
      } catch (_: Exception) {
        promise.reject("HINT_UNAVAILABLE", "Please type your mobile number instead.")
      }
    }
  }

  init {
    context.addActivityEventListener(resultListener)
    context.addLifecycleEventListener(this)
  }
  override fun getName() = "DuitPhoneNumberHint"

  @ReactMethod
  fun requestNumber(promise: Promise) {
    val activity = context.currentActivity
    if (activity == null) {
      promise.reject("HINT_UNAVAILABLE", "Please type your mobile number instead.")
      return
    }
    activity.runOnUiThread {
      if (pending != null) {
        promise.reject("HINT_BUSY", "The number picker is already open.")
        return@runOnUiThread
      }
      pending = promise
      val request = GetPhoneNumberHintIntentRequest.builder().build()
      Identity.getSignInClient(activity).getPhoneNumberHintIntent(request)
        .addOnSuccessListener { intent ->
          if (pending !== promise) return@addOnSuccessListener
          try {
            activity.startIntentSenderForResult(intent.intentSender, requestCode, null, 0, 0, 0)
          } catch (_: Exception) {
            pending = null
            promise.reject("HINT_UNAVAILABLE", "Please type your mobile number instead.")
          }
        }
        .addOnFailureListener {
          if (pending === promise) {
            pending = null
            promise.reject("HINT_UNAVAILABLE", "No number was available. Please type it instead.")
          }
        }
    }
  }

  override fun onHostResume() = Unit
  override fun onHostPause() = Unit
  override fun onHostDestroy() {
    pending?.resolve(null)
    pending = null
  }
  override fun invalidate() {
    onHostDestroy()
    context.removeActivityEventListener(resultListener)
    context.removeLifecycleEventListener(this)
    super.invalidate()
  }
}
