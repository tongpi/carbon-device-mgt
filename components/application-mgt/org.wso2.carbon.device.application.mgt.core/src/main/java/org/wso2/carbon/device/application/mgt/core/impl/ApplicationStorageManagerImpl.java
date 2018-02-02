/*
 *   Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *   WSO2 Inc. licenses this file to you under the Apache License,
 *   Version 2.0 (the "License"); you may not use this file except
 *   in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing,
 *   software distributed under the License is distributed on an
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *   KIND, either express or implied.  See the License for the
 *   specific language governing permissions and limitations
 *   under the License.
 *
 */

package org.wso2.carbon.device.application.mgt.core.impl;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.context.PrivilegedCarbonContext;
import org.wso2.carbon.device.application.mgt.common.Application;
import org.wso2.carbon.device.application.mgt.common.ApplicationRelease;
import org.wso2.carbon.device.application.mgt.common.ImageArtifact;
import org.wso2.carbon.device.application.mgt.common.exception.ApplicationManagementException;
import org.wso2.carbon.device.application.mgt.common.exception.ApplicationStorageManagementException;
import org.wso2.carbon.device.application.mgt.common.exception.ResourceManagementException;
import org.wso2.carbon.device.application.mgt.common.services.ApplicationStorageManager;
import org.wso2.carbon.device.application.mgt.core.internal.DataHolder;
import org.wso2.carbon.device.application.mgt.core.util.ConnectionManagerUtil;
import org.wso2.carbon.device.application.mgt.core.util.Constants;
import org.wso2.carbon.device.application.mgt.core.util.StorageManagementUtil;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

import static org.wso2.carbon.device.application.mgt.core.util.StorageManagementUtil.saveFile;

/**
 * This class contains the default concrete implementation of ApplicationStorage Management.
 */
public class ApplicationStorageManagerImpl implements ApplicationStorageManager {
    private static final Log log = LogFactory.getLog(ApplicationStorageManagerImpl.class);
    private String storagePath;
    private int screenShotMaxCount;

    /**
     * Create a new ApplicationStorageManager Instance
     *
     * @param storagePath        Storage Path to save the binary and image files.
     * @param screenShotMaxCount Maximum Screen-shots count
     */
    public ApplicationStorageManagerImpl(String storagePath, String screenShotMaxCount) {
        this.storagePath = storagePath;
        this.screenShotMaxCount = Integer.parseInt(screenShotMaxCount);
    }

    @Override
    public ApplicationRelease uploadImageArtifacts(int applicationId, ApplicationRelease applicationRelease,
            InputStream iconFileStream, InputStream bannerFileStream, List<InputStream> screenShotStreams) throws ResourceManagementException {

        int tenantId = PrivilegedCarbonContext.getThreadLocalCarbonContext().getTenantId(true);
        String artifactDirectoryPath = null;
        String iconStoredLocation;
        String bannerStoredLocation;
        String scStoredLocation;

        try {
            if (validateApplication(applicationId)) {
                artifactDirectoryPath = storagePath + applicationRelease.getAppHashValue();
                StorageManagementUtil.createArtifactDirectory(artifactDirectoryPath);
            }

            if (artifactDirectoryPath != null) {

                iconStoredLocation = artifactDirectoryPath + File.separator + Constants.IMAGE_ARTIFACTS[0];
                bannerStoredLocation = artifactDirectoryPath + File.separator + Constants.IMAGE_ARTIFACTS[1];
                saveFile(iconFileStream, iconStoredLocation);
                saveFile(bannerFileStream, bannerStoredLocation);
                applicationRelease.setIconLoc(iconStoredLocation);
                applicationRelease.setBannerLoc(bannerStoredLocation);

                if (screenShotStreams.size() > screenShotMaxCount) {
                    throw new ApplicationStorageManagementException("Maximum limit for the screen-shot exceeds");
                }

                int count = 1;
                for (InputStream screenshotStream : screenShotStreams) {
                    scStoredLocation = artifactDirectoryPath + File.separator + Constants.IMAGE_ARTIFACTS[2] + count;
                    if (count == 1) {
                        applicationRelease.setScreenshotLoc1(scStoredLocation);
                    }
                    if (count == 2) {
                        applicationRelease.setScreenshotLoc2(scStoredLocation);
                    }
                    if (count == 3) {
                        applicationRelease.setScreenshotLoc3(scStoredLocation);
                    }
                    saveFile(screenshotStream, scStoredLocation);
                    count++;
                }
            }
            return applicationRelease;
        } catch (IOException e) {
            throw new ApplicationStorageManagementException(
                    "IO Exception while saving the screens hots for the " + "application " + applicationId, e);
        } catch (ApplicationStorageManagementException e) {
            ConnectionManagerUtil.rollbackDBTransaction();
            throw new ApplicationStorageManagementException("Application Management DAO exception while trying to"
                    + " update the screen-shot count for the application " + applicationId + " for the tenant "
                    + tenantId, e);
        }

    }

    @Override
    public ApplicationRelease uploadReleaseArtifacts(int applicationId, ApplicationRelease applicationRelease , InputStream binaryFile)
            throws ResourceManagementException {

        String artifactDirectoryPath;
        String md5OfApp;
        md5OfApp = getMD5(binaryFile);

        if(validateApplication(applicationId) && md5OfApp != null){
            artifactDirectoryPath = storagePath + md5OfApp;
            StorageManagementUtil.createArtifactDirectory(artifactDirectoryPath);
            if (log.isDebugEnabled()) {
                log.debug("Artifact Directory Path for saving the application release related artifacts related with "
                        + "application ID " + applicationId + " is " + artifactDirectoryPath);
            }
            try {
                saveFile(binaryFile, artifactDirectoryPath);
                applicationRelease.setAppStoredLoc(artifactDirectoryPath);
                applicationRelease.setAppHashValue(md5OfApp);
            } catch (IOException e) {
                throw new ApplicationStorageManagementException(
                        "IO Exception while saving the release artifacts in the server for the application "
                                + applicationId, e);
            }

        }else{
            log.error("Verify application existence and md5sum value retrieving process");
        }

        return applicationRelease;
    }

    @Override
    public InputStream getReleasedArtifacts(String applicationUUID, String versionName)
            throws ApplicationStorageManagementException {
        Application application = validateApplication(applicationUUID);
        String artifactPath = storagePath + application.getId() + File.separator + versionName;

        if (log.isDebugEnabled()) {
            log.debug("ApplicationRelease artifacts are searched in the location " + artifactPath);
        }

        File binaryFile = new File(artifactPath);

        if (!binaryFile.exists()) {
            throw new ApplicationStorageManagementException("Binary file does not exist for this release");
        } else {
            try {
                return new FileInputStream(artifactPath);
            } catch (FileNotFoundException e) {
                throw new ApplicationStorageManagementException(
                        "Binary file does not exist for the version " + versionName + " for the application ", e);
            }
        }
    }

    @Override
    public void deleteApplicationArtifacts(String applicationUUID) throws ApplicationStorageManagementException {
        Application application = validateApplication(applicationUUID);
        String artifactDirectoryPath = storagePath + application.getId();
        File artifactDirectory = new File(artifactDirectoryPath);

        if (artifactDirectory.exists()) {
            StorageManagementUtil.deleteDir(artifactDirectory);
        }
    }

    @Override
    public void deleteApplicationReleaseArtifacts(String applicationUUID, String version)
            throws ApplicationStorageManagementException {
        Application application = validateApplication(applicationUUID);
        String artifactPath = storagePath + application.getId() + File.separator + version;
        File artifact = new File(artifactPath);

        if (artifact.exists()) {
            StorageManagementUtil.deleteDir(artifact);
        }
    }

    @Override
    public void deleteAllApplicationReleaseArtifacts(String applicationUUID) throws
            ApplicationStorageManagementException {
        validateApplication(applicationUUID);
        try {
            List<ApplicationRelease> applicationReleases = DataHolder.getInstance().getApplicationReleaseManager()
                    .getReleases(applicationUUID);
            for (ApplicationRelease applicationRelease : applicationReleases) {
                deleteApplicationReleaseArtifacts(applicationUUID, applicationRelease.getVersion());
            }
        } catch (ApplicationManagementException e) {
            throw new ApplicationStorageManagementException(
                    "Application Management Exception while getting releases " + "for the application "
                            + applicationUUID, e);
        }
    }

    @Override
    public ImageArtifact getImageArtifact(String applicationUUID, String name, int count) throws
            ApplicationStorageManagementException {
        Application application = validateApplication(applicationUUID);
        validateImageArtifactNames(name);
        String imageArtifactPath = storagePath + application.getId() + File.separator + name.toLowerCase();

        if (name.equalsIgnoreCase(Constants.IMAGE_ARTIFACTS[2])) {
            imageArtifactPath += count;
        }
        File imageFile = new File(imageArtifactPath);
        if (!imageFile.exists()) {
            throw new ApplicationStorageManagementException(
                    "Image artifact " + name + " does not exist for the " + "application with UUID " + applicationUUID);
        } else {
            try {
                return StorageManagementUtil.createImageArtifact(imageFile, imageArtifactPath);
            } catch (FileNotFoundException e) {
                throw new ApplicationStorageManagementException(
                        "File not found exception while trying to get the image artifact " + name + " for the "
                                + "application " + applicationUUID, e);
            } catch (IOException e) {
                throw new ApplicationStorageManagementException("IO Exception while trying to detect the image "
                        + "artifact " + name + " for the application " + applicationUUID, e);
            }
        }
    }

    /**
     * To validate the image artifact names.
     * @param name Name of the image artifact.
     * @throws ApplicationStorageManagementException Application Storage Management Exception
     */
    private void validateImageArtifactNames(String name) throws ApplicationStorageManagementException {
        if (name == null || name.isEmpty()) {
            throw new ApplicationStorageManagementException("Image artifact name cannot be null or empty. It is a "
                    + "required parameter");
        }
        if (!Arrays.asList(Constants.IMAGE_ARTIFACTS).contains(name.toLowerCase())) {
            throw new ApplicationStorageManagementException("Provide artifact name is not valid. Please provide the "
                    + "name among " + Arrays.toString(Constants.IMAGE_ARTIFACTS));
        }
    }

    /**
     * To validate the Application before storing and retrieving the artifacts of a particular application.
     *
     * @param appId ID of the Application
     * @return {@link Application} if it is validated
     * @throws ApplicationStorageManagementException Application Storage Management Exception will be thrown if a
     *                                               valid application related with the specific UUID
     *                                               could not be found.
     */
    private Boolean validateApplication(int appId) throws ApplicationStorageManagementException {
        Boolean isAppExist;
        try {
            isAppExist = DataHolder.getInstance().getApplicationManager().verifyApplicationExistenceById(appId);
        } catch (ApplicationManagementException e) {
            throw new ApplicationStorageManagementException(
                    "Exception while verifing the application existence for the application with ID "+ appId);
        }

        return isAppExist;
    }

    private String getMD5(InputStream binaryFile) throws ApplicationStorageManagementException {
        String md5;
        try {
            md5 = DigestUtils.md5Hex(IOUtils.toByteArray(binaryFile));
        } catch (IOException e) {
            throw new ApplicationStorageManagementException
                    ("IO Exception while trying to get the md5sum value of application");
        }
        return md5;
    }
}
