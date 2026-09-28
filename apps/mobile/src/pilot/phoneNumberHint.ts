// Browser and iOS keep manual entry; Android supplies the system-owned chooser.
export const canChoosePhoneNumber = false;
export async function choosePhoneNumber(): Promise<string | null> {
  return null;
}
