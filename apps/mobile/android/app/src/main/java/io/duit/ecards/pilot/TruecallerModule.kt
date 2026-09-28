package io.duit.ecards.pilot

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*

class TruecallerModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context), LifecycleEventListener {
  private var pending: Promise? = null
  private val requestCode = 47322
  private val listener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, code: Int, resultCode: Int, data: Intent?) {
      if (code != requestCode) return
      val promise = pending ?: return
      pending = null
      if (resultCode == Activity.RESULT_OK && data != null) {
        promise.resolve(Arguments.createMap().apply {
          putString("authorizationCode", data.getStringExtra("authorizationCode"))
          putString("codeVerifier", data.getStringExtra("codeVerifier"))
        })
      } else if (data?.getStringExtra("error") != null) {
        promise.reject("TRUECALLER_UNAVAILABLE", data.getStringExtra("error"))
      } else promise.resolve(null)
    }
  }
  init { context.addActivityEventListener(listener); context.addLifecycleEventListener(this) }
  override fun getName() = "DuitTruecaller"
  override fun getConstants(): Map<String, Any> = mapOf("clientId" to context.getString(R.string.truecaller_client_id))
  @ReactMethod fun authorize(promise: Promise) {
    val activity = context.currentActivity
    if (activity == null) { promise.reject("TRUECALLER_UNAVAILABLE", "Use your mobile number instead."); return }
    activity.runOnUiThread {
      if (pending != null) { promise.reject("TRUECALLER_BUSY", "Sign-in is already open."); return@runOnUiThread }
      pending = promise
      try { activity.startActivityForResult(Intent(activity, TruecallerAuthActivity::class.java), requestCode) }
      catch (_: Exception) { pending = null; promise.reject("TRUECALLER_UNAVAILABLE", "Use your mobile number instead.") }
    }
  }
  override fun onHostResume() = Unit
  override fun onHostPause() = Unit
  override fun onHostDestroy() { pending?.resolve(null); pending = null }
  override fun invalidate() { onHostDestroy(); context.removeActivityEventListener(listener); context.removeLifecycleEventListener(this); super.invalidate() }
}
