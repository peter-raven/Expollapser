namespace BuildTasks
{
    using System;
    using System.IO;
    using System.Text.RegularExpressions;
    using Microsoft.Build.Framework;

    /// <summary>
    /// Sets build number in specified file using specified pattern.
    /// </summary>
    public class SetBuildNumber : Microsoft.Build.Utilities.Task
    {
        [Required]
        public string Path { get; set; }
        
        [Required]
        public string Filename { get; set; }

        [Required]
        public string BuildNumberRegExPattern { get; set; }

        [Required]
        public int BuildNumber { get; set; }

        /// <summary>
        /// Executes this instance.
        /// </summary>
        /// <returns>True if task succeeded, otherwise, false.</returns>
        public override bool Execute()
        {
            string[] files = System.IO.Directory.GetFiles(Path, Filename);
            foreach (string filename in files)
            {
                string contents = File.ReadAllText(filename);
                var rx = new Regex(BuildNumberRegExPattern);
                File.WriteAllText(filename, rx.Replace(contents, @"$1." + BuildNumber.ToString()));

                this.Log.LogMessage(MessageImportance.Low, string.Format("Updated build number in file {0} to {1}.", filename, BuildNumber));
            }

            return true;
        }
    }
}