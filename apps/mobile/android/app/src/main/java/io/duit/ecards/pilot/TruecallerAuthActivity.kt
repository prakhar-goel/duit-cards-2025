package io.duit.ecards.pilot

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Base64
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import com.truecaller.android.sdk.oAuth.TcSdk
import com.truecaller.android.sdk.oAuth.TcSdkOptions
import com.truecaller.android.sdk.oAuth.TcOAuthCallback
import com.truecaller.android.sdk.oAuth.TcOAuthData
import com.truecaller.android.sdk.oAuth.TcOAuthError
import java.security.MessageDigest
import java.security.SecureRandom

/** Private one-shot OAuth host; codes/verifiers are never persisted or logged. */
class TruecallerAuthActivity : ComponentActivity() {
  private val handler = Handler(Looper.getMainLooper())
  private var state = ""
  private var verifier = ""
  private var completed = false
  private val timeout = Runnable { finishFlow("Truecaller timed out. Use your mobile number instead.") }
  private val launcher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
    try { TcSdk.getInstance().onActivityResultObtained(this, result.resultCode, result.data) }
    catch (_: Exception) { finishFlow("Use your mobile number to continue.") }
  }
  private fun randomToken(): String = Base64.encodeToString(ByteArray(32).also { SecureRandom().nextBytes(it) }, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
  private val callback = object : TcOAuthCallback {
    override fun onSdkReady() { runOnUiThread {
      if (completed || isFinishing) return@runOnUiThread
      try {
        val sdk = TcSdk.getInstance()
        if (!sdk.isOAuthFlowUsable) { finishFlow("Open Truecaller and sign in there first, or use your mobile number here."); return@runOnUiThread }
        sdk.setOAuthState(state)
        sdk.setOAuthScopes(arrayOf("openid", "phone", "profile"))
        sdk.setCodeChallenge(Base64.encodeToString(MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray(Charsets.US_ASCII)), Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING))
        sdk.getAuthorizationCode(this@TruecallerAuthActivity, launcher)
      } catch (_: Exception) { finishFlow("Truecaller is unavailable. Use your mobile number instead.") }
    } }
    override fun onSuccess(data: TcOAuthData) { runOnUiThread {
      if (completed) return@runOnUiThread
      if (data.state != state || data.authorizationCode.isNullOrBlank()) {
        finishFlow("Truecaller verification could not be confirmed. Please try again.")
        return@runOnUiThread
      }
      completed = true
      setResult(Activity.RESULT_OK, Intent().putExtra("authorizationCode", data.authorizationCode).putExtra("codeVerifier", verifier))
      finish()
    } }
    override fun onFailure(error: TcOAuthError) { runOnUiThread {
      finishFlow(if (error.errorCode in listOf(2, 11, 14)) null else "Truecaller could not sign you in. Use your mobile number instead.")
    } }
    override fun onVerificationRequired(error: TcOAuthError?) { runOnUiThread { finishFlow("Use the SMS code option to verify your number.") } }
  }
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (savedInstanceState != null) { finishFlow(null); return }
    state = randomToken()
    verifier = randomToken()
    handler.postDelayed(timeout, 120000)
    try {
      TcSdk.clear()
      val options = TcSdkOptions.Builder(this, callback)
        .buttonColor(Color.parseColor("#123F35"))
        .buttonTextColor(Color.WHITE)
        .sdkOptions(TcSdkOptions.OPTION_VERIFY_ONLY_TC_USERS)
        .footerType(TcSdkOptions.FOOTER_TYPE_ANOTHER_METHOD)
        .build()
      TcSdk.initAsync(options)
    } catch (_: Exception) { finishFlow("Truecaller is unavailable. Use your mobile number instead.") }
  }
  private fun finishFlow(message: String?) {
    if (completed) return
    completed = true
    setResult(Activity.RESULT_CANCELED, Intent().putExtra("error", message))
    finish()
  }
  override fun onDestroy() {
    completed = true
    handler.removeCallbacks(timeout)
    TcSdk.clear()
    state = ""
    verifier = ""
    super.onDestroy()
  }
}
